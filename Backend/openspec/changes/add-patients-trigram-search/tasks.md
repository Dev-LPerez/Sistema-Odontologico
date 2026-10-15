# Tasks

## Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto)
Cada escenario de `specs/patients-management/spec.md` DEBE estar cubierto por las siguientes pruebas con estos nombres exactos en `it(...)`:

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Contrato (PostgreSQL Real + InMemory) | Archivo E2E (`Backend/test/patients.e2e-spec.ts`) |
| :--- | :--- | :--- |
| **Scenario:** Búsqueda exitosa por nombre con errores tipográficos y sin tildes para ADMIN o AUXILIARY | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por nombre tolerando errores tipográficos y omisión de tildes ordenando por relevancia dentro del mismo clinicId')` | `it('debe permitir a ADMIN y AUXILIARY buscar pacientes tolerando errores tipográficos y sin tildes en GET /v1/patients/search (200)')` |
| **Scenario:** Búsqueda exitosa por fragmento de documento o teléfono con caracteres de formato | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por fragmento de documento o teléfono normalizando guiones y espacios')` | `it('debe encontrar pacientes por fragmento de documento o teléfono en GET /v1/patients/search (200)')` |
| **Scenario:** Exclusión por defecto de pacientes inactivos e inclusión opcional en búsqueda | `patients-queries.contract.spec.ts` -> `it('debe excluir pacientes inactivos por defecto e incluirlos cuando includeInactive es true')` | `it('debe excluir pacientes inactivos por defecto e incluirlos con includeInactive=true en GET /v1/patients/search (200)')` |
| **Scenario:** Respuesta en menos de 300 ms sobre 10.000 pacientes reales en PostgreSQL usando índice GIN | `patients-queries.contract.spec.ts` -> `it('debe responder en menos de 300 ms sobre 10.000 pacientes reales y usar Bitmap Index Scan sobre el índice GIN en EXPLAIN ANALYZE (RNF-B-031, RC-031)')` | Cubierto en suite de contrato contra PostgreSQL real |

---

## 1. Migración de índices GIN `pg_trgm` en Prisma
- [x] 1.1 Crear la migración `Backend/prisma/migrations/20261014010000_add_patients_trigram_indexes/migration.sql`.
- [x] 1.2 Ejecutar `pnpm --filter backend typecheck` y confirmar con commit.

## 2. Puerto segregado `PatientQueriesPort` y `SearchPatientsQuery` en `application` con TDD
- [x] 2.1 Definir `PatientQueriesPort` (`PATIENT_QUERIES_TOKEN`) en `Backend/src/modules/patients/application/ports/patient.queries.port.ts`.
- [x] 2.2 Escribir las pruebas unitarias en `Backend/src/modules/patients/application/queries/search-patients.query.spec.ts`.
- [x] 2.3 Implementar `Backend/src/modules/patients/application/queries/search-patients.query.ts`.
- [x] 2.4 Ejecutar verificaciones y hacer commit.

## 3. Adaptadores `InMemory` y `Prisma` de `PatientQueriesPort` + Suite de Contrato y Benchmark (RC-018, RC-031)
- [x] 3.1 Implementar `trigram-similarity.util.ts`, `in-memory-patient.queries.ts` y `prisma-patient.queries.ts`.
- [x] 3.2 Escribir la suite de contrato `patients-queries.contract.spec.ts`.
- [x] 3.3 Ejecutar verificaciones y hacer commit.

## 4. Endpoint `GET /v1/patients/search`, cableado en módulo y pruebas E2E (RC-005)
- [x] 4.1 Crear `search-patients-query.dto.ts` y exponer `@Get('search')` en `PatientsController`.
- [x] 4.2 Extender `Backend/test/patients.e2e-spec.ts`.
- [x] 4.3 Ejecutar verificaciones y hacer commit.

## 5. Regeneración del contrato OpenAPI, captura de evidencia y cierre inicial
- [x] 5.1 Regenerar `Backend/openapi.json`.
- [x] 5.2 Crear `Backend/openspec/changes/add-patients-trigram-search/evidence.md`.
- [x] 5.3 Confirmar cambios con commit.

## 6. Correcciones de Auditoría Transversal (PII, `configureApp` y `CORS_ORIGIN`)
- [x] 6.1 Redacción completa de PII de pacientes en Logs y Sentry (`RC-023`, `RNF-B-009`).
- [x] 6.2 Extracción de `configureApp(app)` y validación de `CORS_ORIGIN` en producción (`RNF-B-005`).
- [x] 6.3 Registro de evidencia en `evidence.md`.

## 7. Remediación de Bloqueantes de Base de Datos Real, Integridad y Rendimiento (B-05 y B-06)
- [x] 7.1 **Migración `onDelete: Restrict`, extensión `unaccent` e índice GIN funcional (`RF-B-010`, `RC-050`, `RC-055`):**
  - En `Backend/docker/postgres/init.sql` y en `Backend/prisma/schema.prisma`, agregar la extensión `unaccent` y cambiar en el modelo `Patient` la relación `clinic` de `onDelete: Cascade` a `onDelete: Restrict`.
  - Crear la migración `Backend/prisma/migrations/20261014013000_fix_patients_restrict_and_trgm_unaccent/migration.sql` que:
    1. Reemplaza la FK `patients_clinic_id_fkey` con `ON DELETE RESTRICT ON UPDATE CASCADE`.
    2. Activa `CREATE EXTENSION IF NOT EXISTS "unaccent";` y crea la función inmutable `immutable_unaccent(text)`.
    3. Elimina `patients_first_name_trgm_idx` y `patients_last_name_trgm_idx` y crea `CREATE INDEX IF NOT EXISTS "patients_full_name_unaccent_trgm_idx" ON "patients" USING GIN ((immutable_unaccent("first_name" || ' ' || "last_name")) gin_trgm_ops);`.
  - En `.github/workflows/backend-ci.yml`, cambiar `npx prisma db push` por `npx prisma migrate deploy` (`RC-050`), y aplicar `npx prisma migrate deploy` sobre el contenedor local de PostgreSQL.
- [x] 7.2 **Traducción de error `P2002` en condiciones de carrera al guardar (`409 CONFLICT`):**
  - En `PrismaPatientRepository.save`, capturar `Prisma.PrismaClientKnownRequestError` con `code === 'P2002'` y lanzar `new DuplicatePatientDocumentError(patient.document.number)`. Hacer la misma validación de unicidad en `InMemoryPatientRepository.save` cuando otro paciente (`id !== patient.id`) ya tiene el mismo `(clinicId, document.type, document.number)`.
  - Hacer lo mismo en `PrismaUserRepository.save` e `InMemoryUserRepository.save` lanzando `DuplicateUserEmailError(user.email.value)` ante colisión `P2002` de correo.
- [x] 7.3 **Optimización SQL en `PrismaPatientQueriesAdapter` para usar los índices GIN y `immutable_unaccent` (`RC-031`):**
  - Actualizar `Backend/src/modules/patients/infrastructure/queries/prisma-patient.queries.ts` para que el `WHERE` filtre usando operadores indexables de `pg_trgm` sobre las columnas/expresiones indexadas:
    - `immutable_unaccent(p.first_name || ' ' || p.last_name) % immutable_unaccent(${query})`
    - `OR immutable_unaccent(p.first_name || ' ' || p.last_name) %> immutable_unaccent(${query})`
    - `OR immutable_unaccent(p.first_name || ' ' || p.last_name) ILIKE ('%' || immutable_unaccent(${query}) || '%')`
    - `OR p.document_number ILIKE ${digitPattern} OR p.phone ILIKE ${digitPattern}` (sin `regexp_replace` sobre `p.phone`).
  - Ajustar `in-memory-patient.queries.ts` para que también soporte coincidencia por palabras (`word_similarity`) y tildes (`"Ines"` -> `"Inés"`), manteniendo paridad total con PostgreSQL.
- [x] 7.4 **Suites de Contrato contra PostgreSQL Real (Cero mocks de Prisma en `*.contract.spec.ts`, `RC-018`, `RC-031`):**
  - Refactorizar `identity-repositories.contract.spec.ts`, `patients-repository.contract.spec.ts` y `patients-queries.contract.spec.ts` eliminando por completo los mocks en memoria de `PrismaService` y conectando las implementaciones `Prisma*` a la instancia real de `PrismaService` (PostgreSQL).
  - En `patients-repository.contract.spec.ts`, agregar las pruebas:
    - `it('debe lanzar DuplicatePatientDocumentError (409) cuando dos registros distintos chocan en el índice único de documento (P2002)')`
    - `it('debe impedir el borrado físico de un consultorio que tiene pacientes registrados (onDelete: Restrict, RF-B-010, RC-055)')`
  - En `patients-queries.contract.spec.ts`, actualizar y ejecutar contra `InMemory` y **PostgreSQL real**:
    - `it('debe encontrar pacientes por nombre tolerando errores tipográficos y omisión de tildes ordenando por relevancia dentro del mismo clinicId')` (probando tanto `"Carls Gomz"` -> `"Carlos Gómez"` como `"Ines"` -> `"Inés Martínez"`).
    - `it('debe responder en menos de 300 ms sobre 10.000 pacientes reales y usar Bitmap Index Scan sobre el índice GIN en EXPLAIN ANALYZE (RNF-B-031, RC-031)')` (insertando 10.000 registros reales en PostgreSQL con `createMany`, midiendo `< 300 ms` y ejecutando `EXPLAIN ANALYZE` para verificar que el plan usa `patients_full_name_unaccent_trgm_idx`).
- [x] 7.5 **Verificación completa, `evidence.md` literal y commit de cierre de B-06:**
  - Actualizar el nombre del test en `search-patients.query.spec.ts` y `Backend/test/patients.e2e-spec.ts` según la Matriz de Trazabilidad (incluyendo búsqueda de `"Ines"` -> `"Inés"`).
  - Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e` contra el contenedor PostgreSQL real.
  - Actualizar `Backend/openspec/changes/add-patients-trigram-search/evidence.md` con la salida **literal e íntegra** de consola de los 5 comandos y hacer commit: `git add -A && git commit -m "fix(patients): run contract suites on real Postgres, enforce onDelete Restrict, handle P2002 and use unaccent GIN index"` dejando `git status` limpio.

## Workflow follow-up
- Ejecutar `/opsx-sync` y `/opsx-archive` una vez auditado `evidence.md`.