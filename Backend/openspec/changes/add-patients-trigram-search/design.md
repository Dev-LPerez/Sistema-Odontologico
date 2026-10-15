# Design

## Context
En **B-05 (`add-patients-core`)** implementamos el agregado `Patient` y el puerto `PatientRepositoryPort` (5 métodos). En **B-06** segregamos la lectura difusa en `PatientQueriesPort` (`ISP`) y cerramos además las brechas de infraestructura detectadas en auditoría sobre `patients`: ejecución de pruebas de contrato contra PostgreSQL real (`RC-018`, `RC-050`), protección contra borrado físico (`onDelete: Restrict`, `RF-B-010`, `RC-055`), traducción de errores de unicidad `P2002` en condiciones de carrera (`409 CONFLICT`), y activación real de índices GIN con `pg_trgm` + `unaccent` verificada mediante `EXPLAIN ANALYZE` (`RC-031`).

## Goals / Non-Goals

**Goals:**
- Segregar las lecturas de búsqueda rápida en `PatientQueriesPort` (`PATIENT_QUERIES_TOKEN`) dentro de `modules/patients/application/ports/patient.queries.port.ts` (CQRS ligero e ISP).
- Garantizar paridad exacta de tildes (`"Ines"` <-> `"Inés"`) y trigramas entre `InMemoryPatientQueriesAdapter` y PostgreSQL mediante la extensión `unaccent` y una función inmutable `immutable_unaccent(text)`.
- Activar el uso real de los índices GIN `gin_trgm_ops` en PostgreSQL usando los operadores indexables de `pg_trgm` (`%`, `%>`, `ILIKE`) sobre las expresiones indexadas y verificarlo con `EXPLAIN ANALYZE` sobre 10.000 pacientes reales en `< 300 ms`.
- Reemplazar `onDelete: Cascade` por `onDelete: Restrict` en `Patient` (`RF-B-010`, `RC-055`) y traducir `P2002` a `DuplicatePatientDocumentError` (`409`).
- Ejecutar todas las suites de contrato (`*.contract.spec.ts`) contra PostgreSQL real (sin mocks de Prisma).

**Non-Goals:**
- Motor de búsqueda externo como Elasticsearch o Algolia (descartado en Sección 3.5 del Stack a favor de `pg_trgm`).

## Decisions

1. **Puerto Segregado `PatientQueriesPort` (ISP y CQRS Ligero):**
   - *Decisión:* Crear `Backend/src/modules/patients/application/ports/patient.queries.port.ts` con un único método `searchByTrigram(params: SearchPatientsByTrigramParams): Promise<PatientSearchItemDto[]>`.

2. **Extensión `unaccent`, Función `immutable_unaccent` e Índices GIN que PostgreSQL Realmente Utiliza (`RC-031`):**
   - *Problema detectado:* Filtrar con `similarity(concat(...), q) >= 0.25` o `regexp_replace(p.phone, ...)` impide que PostgreSQL use índices GIN `gin_trgm_ops` (forzando `Seq Scan`), y además `pg_trgm` sin `unaccent` falla en nombres cortos con tilde (`"Ines"` vs `"Inés"`).
   - *Decisión:*
     - Crear la migración `20261014013000_fix_patients_restrict_and_trgm_unaccent` que:
       1. Activa `CREATE EXTENSION IF NOT EXISTS "unaccent";`.
       2. Define la función `immutable_unaccent(text)` marcada como `IMMUTABLE PARALLEL SAFE STRICT`.
       3. Elimina los índices separados no utilizados (`patients_first_name_trgm_idx`, `patients_last_name_trgm_idx`) y crea el índice funcional compuesto:
          `CREATE INDEX "patients_full_name_unaccent_trgm_idx" ON "patients" USING GIN ((immutable_unaccent("first_name" || ' ' || "last_name")) gin_trgm_ops);`
          conservando `patients_document_number_trgm_idx` y `patients_phone_trgm_idx`.
     - En `PrismaPatientQueriesAdapter`, usar en el `WHERE` únicamente operadores indexables por GIN sobre las expresiones indexadas:
       - `immutable_unaccent(p.first_name || ' ' || p.last_name) % immutable_unaccent(${query})`
       - `OR immutable_unaccent(p.first_name || ' ' || p.last_name) %> immutable_unaccent(${query})`
       - `OR immutable_unaccent(p.first_name || ' ' || p.last_name) ILIKE ('%' || immutable_unaccent(${query}) || '%')`
       - `OR p.document_number ILIKE ${digitPattern} OR p.phone ILIKE ${digitPattern}` (aprovechando que `PhoneNumber` ya persiste el teléfono normalizado sin guiones ni espacios).

3. **Prohibición de Borrado Físico (`onDelete: Restrict`) y Traducción de `P2002` (`RF-B-010`, `RC-055`):**
   - *Decisión:* Cambiar la relación `Patient.clinic` en `schema.prisma` a `onDelete: Restrict` y capturar `Prisma.PrismaClientKnownRequestError` (`code === 'P2002'`) en `PrismaPatientRepository.save` (y su equivalente en `InMemoryPatientRepository.save`) lanzando `DuplicatePatientDocumentError` (`409 CONFLICT`).

4. **Pruebas de Contrato contra PostgreSQL Real (`RC-018`, `RC-050`):**
   - *Decisión:* Eliminar los mocks manuales de `PrismaService` en `identity-repositories.contract.spec.ts`, `patients-repository.contract.spec.ts` y `patients-queries.contract.spec.ts` para que corran contra la base PostgreSQL real con `prisma migrate deploy` aplicado.

## Risks / Trade-offs
- **[Risk] Tiempo de inserción de 10.000 pacientes en la prueba de contrato contra PostgreSQL real** → *Mitigación:* Usar `prisma.client.patient.createMany({ data: ... })` en un solo lote dentro del test de benchmark, lo que inserta las 10.000 filas en ~150 ms antes de medir `searchByTrigram` y `EXPLAIN ANALYZE`.