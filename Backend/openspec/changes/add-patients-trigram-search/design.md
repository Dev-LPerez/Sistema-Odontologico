# Design

## Context
En **B-05 (`add-patients-core`)** implementamos el agregado `Patient` y el puerto `PatientRepositoryPort` con exactamente 5 métodos (`findById`, `findByDocument`, `findPotentialDuplicates`, `findAllByClinicId` y `save`). Para implementar ahora la búsqueda difusa tolerante a errores tipográficos (`RF-B-012`) en $<300\text{ ms}$ con hasta 10.000 pacientes (`RNF-B-031`, `RC-031`) sin violar el límite de 5 métodos por interfaz del Principio de Segregación de Interfaces (ISP, Sección 3.3 del documento de Stack), segregamos la lectura especializada en `PatientQueriesPort`.

## Goals / Non-Goals

**Goals:**
- Segregar las lecturas de búsqueda rápida en `PatientQueriesPort` (`PATIENT_QUERIES_TOKEN`) dentro de `modules/patients/application/ports/patient.queries.port.ts` (CQRS ligero e ISP).
- Añadir índices GIN con `gin_trgm_ops` en PostgreSQL mediante migración versionada para garantizar tiempos $<300\text{ ms}$.
- Mantener paridad funcional entre `InMemoryPatientQueriesAdapter` y `PrismaPatientQueriesAdapter` validada con una suite de pruebas de contrato (`RC-018`) y prueba de rendimiento con 10.000 registros (`RC-031`).
- Exponer `GET /v1/patients/search` protegido para `ADMIN` y `AUXILIARY` (`RC-005`).

**Non-Goals:**
- Motor de búsqueda externo como Elasticsearch o Algolia (descartado en Sección 3.5 del Stack a favor de `pg_trgm`).

## Decisions

1. **Puerto Segregado `PatientQueriesPort` (ISP y CQRS Ligero):**
   - *Decisión:* Crear `Backend/src/modules/patients/application/ports/patient.queries.port.ts` con un único método `searchByTrigram(params: SearchPatientsByTrigramParams): Promise<PatientSearchItemDto[]>`.
   - *Justificación:* `PatientRepositoryPort` ya tiene 5 métodos orientados al ciclo de vida del agregado `Patient`. La búsqueda global para autocompletado en el iPad (`RF-F-012`) devuelve proyecciones ligeras ordenadas por relevancia sin necesidad de hidratar agregados completos para escritura.

2. **Índices GIN `pg_trgm` y Consulta Parametrizada Segura en Prisma:**
   - *Decisión:*
     - Crear la migración `20261014010000_add_patients_trigram_indexes` con índices GIN `gin_trgm_ops` sobre `first_name`, `last_name`, `document_number` y `phone`.
     - En `PrismaPatientQueriesAdapter`, usar `this.prisma.client.$queryRaw` con *tagged templates* de Prisma (`Prisma.sql`), evaluando `word_similarity` / `similarity` sobre `first_name || ' ' || last_name`, además de `ILIKE` sobre nombre, `document_number` y `phone`, siempre restringido por `clinic_id = ${clinicId}`.
   - *Justificación:* Previene inyección SQL (`RNF-B-005`), respeta el contexto transaccional (`this.prisma.client`) y aprovecha los índices GIN en PostgreSQL.

3. **Algoritmo de Trigramas Determinista en `InMemoryPatientQueriesAdapter` (`RC-018`, `RC-031`):**
   - *Decisión:* Implementar una función pura de similitud de trigramas (coeficiente de Dice / intersección de trigramas normalizados sin tildes + coincidencia de subcadenas en documento y teléfono) que permita a la suite de contrato (`patients-queries.contract.spec.ts`) probar tanto errores tipográficos reales (`"Carls Gomz"` -> `"Carlos Gómez"`) como el benchmark de 10.000 pacientes en $<300\text{ ms}$.

## Risks / Trade-offs
- **[Risk] Colisión de ruta en NestJS entre `GET /v1/patients/search` y `GET /v1/patients/:id`** → *Mitigación:* Declarar `@Get('search')` antes de `@Get(':id')` en `PatientsController`.
- **[Risk] Términos vacíos o de 1 solo carácter disparan escaneos costosos** → *Mitigación:* Si `q.trim().length < 2`, `SearchPatientsQuery` retorna `[]` inmediatamente sin consultar la base de datos.