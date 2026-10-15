# Tasks

## Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto)
Cada escenario de `specs/patients-management/spec.md` DEBE estar cubierto por las siguientes pruebas con estos nombres exactos en `it(...)`:

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Contrato | Archivo E2E (`Backend/test/patients.e2e-spec.ts`) |
| :--- | :--- | :--- |
| **Scenario:** Búsqueda exitosa por nombre con errores tipográficos para ADMIN o AUXILIARY | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por nombre tolerando errores tipográficos y ordenando por relevancia dentro del mismo clinicId')` | `it('debe permitir a ADMIN y AUXILIARY buscar pacientes tolerando errores tipográficos en GET /v1/patients/search (200)')` |
| **Scenario:** Búsqueda exitosa por fragmento de documento o teléfono con caracteres de formato | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por fragmento de documento o teléfono normalizando guiones y espacios')` | `it('debe encontrar pacientes por fragmento de documento o teléfono en GET /v1/patients/search (200)')` |
| **Scenario:** Exclusión por defecto de pacientes inactivos e inclusión opcional en búsqueda | `patients-queries.contract.spec.ts` -> `it('debe excluir pacientes inactivos por defecto e incluirlos cuando includeInactive es true')` | `it('debe excluir pacientes inactivos por defecto e incluirlos con includeInactive=true en GET /v1/patients/search (200)')` |
| **Scenario:** Respuesta en menos de 300 ms sobre un catálogo de 10.000 pacientes | `patients-queries.contract.spec.ts` -> `it('debe responder en menos de 300 ms al buscar sobre 10.000 pacientes sintéticos (RNF-B-031, RC-031)')` | Cubierto en suite de contrato/rendimiento |

---

## 1. Migración de índices GIN `pg_trgm` en Prisma
- [x] 1.1 Crear la migración `Backend/prisma/migrations/20261014010000_add_patients_trigram_indexes/migration.sql` con los índices GIN `CREATE INDEX IF NOT EXISTS "patients_first_name_trgm_idx" ON "patients" USING GIN ("first_name" gin_trgm_ops);`, `CREATE INDEX IF NOT EXISTS "patients_last_name_trgm_idx" ON "patients" USING GIN ("last_name" gin_trgm_ops);`, `CREATE INDEX IF NOT EXISTS "patients_document_number_trgm_idx" ON "patients" USING GIN ("document_number" gin_trgm_ops);` y `CREATE INDEX IF NOT EXISTS "patients_phone_trgm_idx" ON "patients" USING GIN ("phone" gin_trgm_ops);`.
- [x] 1.2 Ejecutar `pnpm --filter backend typecheck` y confirmar con commit: `git add Backend/prisma && git commit -m "feat(patients): add pg_trgm GIN indexes migration for fast fuzzy patient search"`

## 2. Puerto segregado `PatientQueriesPort` y `SearchPatientsQuery` en `application` con TDD
- [x] 2.1 Definir en `Backend/src/modules/patients/application/ports/patient.queries.port.ts` el token `PATIENT_QUERIES_TOKEN`, la interfaz `SearchPatientsByTrigramParams` (`clinicId`, `query`, `normalizedDigits`, `includeInactive`, `limit`), el DTO `PatientSearchItemDto` y el puerto `PatientQueriesPort` (1 método `searchByTrigram`, cumpliendo ISP).
- [x] 2.2 Escribir las pruebas unitarias en rojo en `Backend/src/modules/patients/application/queries/search-patients.query.spec.ts` incluyendo los tests exactos de la Matriz de Trazabilidad, retorno de `[]` cuando `q` tiene menos de 2 caracteres, límite por defecto (`20`) y tope máximo (`50`).
- [x] 2.3 Implementar `Backend/src/modules/patients/application/queries/search-patients.query.ts` (un único método público `execute`, `RC-015`) manteniendo cobertura $\ge 90\%$ en `domain` y `application` (`RC-002`).
- [x] 2.4 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/patients/application && git commit -m "feat(patients): add segregated PatientQueriesPort and SearchPatientsQuery"`

## 3. Adaptadores `InMemory` y `Prisma` de `PatientQueriesPort` + Suite de Contrato y Benchmark (RC-018, RC-031)
- [x] 3.1 Implementar `Backend/src/modules/patients/infrastructure/queries/trigram-similarity.util.ts` (normalización sin tildes y similitud por trigramas), `in-memory-patient.queries.ts` (conectado al almacén de `InMemoryPatientRepository`) y `prisma-patient.queries.ts` (usando `this.prisma.client.$queryRaw` parametrizado con `similarity` / `ILIKE` y `PatientMapper`).
- [x] 3.2 Escribir y ejecutar la suite de pruebas de contrato `Backend/src/modules/patients/infrastructure/queries/patients-queries.contract.spec.ts` (`RC-018`, `RC-031`) que corre contra `InMemoryPatientQueriesAdapter` y `PrismaPatientQueriesAdapter` implementando exactamente los 4 escenarios de la Matriz de Trazabilidad (incluyendo aislamiento por `clinicId` y el benchmark de $<300\text{ ms}$ con 10.000 pacientes sintéticos).
- [x] 3.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/patients/infrastructure && git commit -m "feat(patients): implement Prisma and InMemory trigram search adapters with 10k benchmark"`

## 4. Endpoint `GET /v1/patients/search`, cableado en módulo y pruebas E2E (RC-005)
- [x] 4.1 Crear `Backend/src/modules/patients/presentation/dto/search-patients-query.dto.ts`, exponer `@Get('search')` en `PatientsController` (ubicado antes de `@Get(':id')`, protegido con `@Roles(UserRole.ADMIN, UserRole.AUXILIARY)`), actualizar `patients.controller.spec.ts`, registrar `PATIENT_QUERIES_TOKEN` y `SearchPatientsQuery` en `patients.module.ts` y exportarlos en `Backend/src/modules/patients/index.ts`.
- [x] 4.2 Extender `Backend/test/patients.e2e-spec.ts` sobreescribiendo `PATIENT_QUERIES_TOKEN` con `InMemoryPatientQueriesAdapter` y agregando los 3 bloques `it(...)` exactos de la Matriz de Trazabilidad más una prueba de rechazo `401` sin token.
- [x] 4.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e` en verde, y hacer commit: `git add Backend/src Backend/test && git commit -m "feat(patients): expose GET /v1/patients/search endpoint with E2E tests"`

## 5. Regeneración del contrato OpenAPI, captura de evidencia y cierre
- [x] 5.1 Regenerar `Backend/openapi.json` (`pnpm --filter backend openapi:generate`) verificando que `/v1/patients/search` aparezca documentado con sus query params (`q`, `limit`, `includeInactive`).
- [x] 5.2 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e`, y crear `Backend/openspec/changes/add-patients-trigram-search/evidence.md` con la Matriz de Trazabilidad completada y la salida literal de consola de los 5 comandos.
- [x] 5.3 Confirmar el contrato OpenAPI, `evidence.md` y `tasks.md` con un commit: `git add -A && git commit -m "chore(patients): regenerate openapi.json and record B-06 test evidence"` dejando `git status` limpio.

## 6. Correcciones de Auditoría Transversal (Bloqueantes antes de archivar B-06)
- [x] 6.1 **Redacción completa de PII de pacientes en Logs y Sentry (`RC-023`, `RNF-B-009`):**
  - Escribir primero las pruebas en rojo en `Backend/src/shared/infrastructure/logger/logger.redact.spec.ts` y `Backend/src/shared/infrastructure/sentry/sentry.sanitizer.spec.ts` (`it('debe redactar todos los datos personales del paciente: firstName, lastName, email, address, birthDate, emergencyContactName y emergencyContactPhone (RC-023)')`).
  - Agregar en `CLINICAL_REDACT_PATHS` (`logger.config.ts`) y en `SENSITIVE_KEYS` (`sentry.sanitizer.ts`) los campos `firstName`, `lastName`, `email`, `address`, `birthDate`, `emergencyContactName` y `emergencyContactPhone` (y sus variantes `*.campo` en Pino).
- [x] 6.2 **Extracción de `configureApp(app)` y validación de `CORS_ORIGIN` en producción (`RNF-B-005`):**
  - Escribir primero la prueba unitaria `Backend/src/configure-app.spec.ts` probando que `validateEnv` falla si falta `DATABASE_URL`, que en `NODE_ENV === 'production'` falla si falta `CORS_ORIGIN` o si `CORS_ORIGIN === '*'` o si falta `JWT_SECRET`, y que `configureApp(app)` registra `helmet`, `cookieParser`, CORS sin `'*'` (usando `process.env.CORS_ORIGIN || 'http://localhost:5173'`), prefijo global `'v1'` (excluyendo `'health'` y `'ready'`), `DomainExceptionFilter` y `ValidationPipe`.
  - Implementar `Backend/src/configure-app.ts` exportando `validateEnv` y `configureApp`, excluir `configure-app.ts` o mantenerlo cubierto al 100%, y reutilizar `configureApp(app)` en `Backend/src/main.ts` y en **todas** las suites E2E (`Backend/test/health.e2e-spec.ts`, `Backend/test/auth.e2e-spec.ts`, `Backend/test/users-and-clinic.e2e-spec.ts` y `Backend/test/patients.e2e-spec.ts`) eliminando la duplicación manual de pipes/filtros/prefijos.
- [x] 6.3 **Evidencia 100 % literal en `evidence.md`:**
  - Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e`.
  - Actualizar `Backend/openspec/changes/add-patients-trigram-search/evidence.md` pegando la salida **literal e íntegra** de consola de los 5 comandos (incluyendo las líneas `> backend@0.0.1 ...` de `pnpm` en `lint` y `typecheck` sin comentarios inventados, y la **tabla ASCII completa** de cobertura de Jest en `test:cov`).
  - Confirmar con commit: `git add -A && git commit -m "fix(patients): redact full patient PII, share configureApp in E2E and record literal evidence"` dejando `git status` limpio.

## Workflow follow-up
- Ejecutar `/opsx-sync` y `/opsx-archive` una vez auditado `evidence.md`.