# Evidencia de Calidad y Trazabilidad - Change B-06 (add-patients-trigram-search)

Este documento certifica la implementación completa, verificación estricta y cumplimiento de los requisitos funcionales, no funcionales y de calidad para el Change **B-06 (`add-patients-trigram-search`)**, incluyendo las remediaciones de base de datos real, integridad referencial y suites de contrato de la Sección 7.

- **Requisitos de Negocio Cubiertos:** `RF-B-010`, `RF-B-012`, `RNF-B-004`, `RNF-B-005`, `RNF-B-009`, `RNF-B-031`, `RNF-B-032`, `RC-001`, `RC-002`, `RC-003`, `RC-005`, `RC-010`, `RC-011`, `RC-012`, `RC-015`, `RC-017`, `RC-018`, `RC-023`, `RC-031`, `RC-050`, `RC-055`, `RC-070`, `RC-073`, `RC-074`.
- **Ruta Git / Rama:** `feat/add-patients-trigram-search`

---

## 1. Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto)

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Contrato (PostgreSQL Real + InMemory) | Archivo E2E (`Backend/test/patients.e2e-spec.ts`) | Estado |
| :--- | :--- | :--- | :--- |
| **Scenario:** Búsqueda exitosa por nombre con errores tipográficos y sin tildes para ADMIN o AUXILIARY | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por nombre tolerando errores tipográficos y omisión de tildes ordenando por relevancia dentro del mismo clinicId')` | `it('debe permitir a ADMIN y AUXILIARY buscar pacientes tolerando errores tipográficos y sin tildes en GET /v1/patients/search (200)')` | ✅ PASA |
| **Scenario:** Búsqueda exitosa por fragmento de documento o teléfono con caracteres de formato | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por fragmento de documento o teléfono normalizando guiones y espacios')` | `it('debe encontrar pacientes por fragmento de documento o teléfono en GET /v1/patients/search (200)')` | ✅ PASA |
| **Scenario:** Exclusión por defecto de pacientes inactivos e inclusión opcional en búsqueda | `patients-queries.contract.spec.ts` -> `it('debe excluir pacientes inactivos por defecto e incluirlos cuando includeInactive es true')` | `it('debe excluir pacientes inactivos por defecto e incluirlos con includeInactive=true en GET /v1/patients/search (200)')` | ✅ PASA |
| **Scenario:** Respuesta en menos de 300 ms sobre 10.000 pacientes reales en PostgreSQL usando índice GIN | `patients-queries.contract.spec.ts` -> `it('debe responder en menos de 300 ms sobre 10.000 pacientes reales y usar Bitmap Index Scan sobre el índice GIN en EXPLAIN ANALYZE (RNF-B-031, RC-031)')` | Cubierto en suite de contrato contra PostgreSQL real con `EXPLAIN ANALYZE` (`patients_full_name_unaccent_trgm_idx`) | ✅ PASA |
| **Sección 7 (Integridad):** Manejo de colisión `P2002` en pacientes | `patients-repository.contract.spec.ts` -> `it('debe lanzar DuplicatePatientDocumentError (409) cuando dos registros distintos chocan en el índice único de documento (P2002)')` | Cubierto en unitarias, contrato y `test/patients.e2e-spec.ts` | ✅ PASA |
| **Sección 7 (Integridad):** Restricción FK `onDelete: Restrict` en pacientes | `patients-repository.contract.spec.ts` -> `it('debe impedir el borrado físico de un consultorio que tiene pacientes registrados (onDelete: Restrict, RF-B-010, RC-055)')` | Cubierto en suite de contrato contra PostgreSQL real | ✅ PASA |
| **Sección 7 (Integridad):** Manejo de colisión `P2002` en usuarios de identidad | `identity-repositories.contract.spec.ts` -> `it('debe lanzar DuplicateUserEmailError (409) cuando dos usuarios chocan en el índice único de email (P2002)')` | Cubierto en suite de contrato contra PostgreSQL real | ✅ PASA |

---

## 2. Salida Literal de Comandos de Calidad

### 2.1 `pnpm --filter backend lint`
```text
$ eslint "{src,test}/**/*.ts" --max-warnings 0
```

### 2.2 `pnpm --filter backend typecheck`
```text
$ tsc --noEmit
```

### 2.3 `pnpm --filter backend deps:check`
```text
$ depcruise --config .dependency-cruiser.js src

✔ no dependency violations found (178 modules, 734 dependencies cruised)
```

### 2.4 `pnpm --filter backend test:cov`
```text
$ jest --coverage
PASS src/modules/patients/infrastructure/queries/patients-queries.contract.spec.ts (9.784 s)
PASS src/modules/patients/presentation/patients.controller.spec.ts
PASS src/modules/patients/infrastructure/repositories/patients-repository.contract.spec.ts
PASS src/modules/identity/presentation/clinic.controller.spec.ts
PASS src/modules/patients/presentation/dto/search-patients-query.dto.spec.ts
PASS src/modules/identity/presentation/users.controller.spec.ts
PASS src/configure-app.spec.ts
PASS src/modules/identity/infrastructure/adapters/argon2-password-hasher.adapter.spec.ts
PASS src/modules/identity/infrastructure/repositories/identity-repositories.contract.spec.ts
PASS src/health/health.controller.spec.ts
PASS src/shared/infrastructure/adapters/nest-event-bus.adapter.spec.ts
PASS src/shared/presentation/guards/jwt-auth.guard.spec.ts
PASS src/shared/presentation/guards/roles.guard.spec.ts
PASS src/modules/identity/application/queries/get-authenticated-user.query.spec.ts
PASS src/modules/identity/application/use-cases/change-user-status.use-case.spec.ts
PASS src/modules/identity/infrastructure/adapters/jwt-token-service.adapter.spec.ts
PASS src/modules/identity/application/use-cases/update-clinic-profile.use-case.spec.ts
PASS src/shared/infrastructure/prisma/prisma.service.spec.ts
[Nest] 14332  - 14/10/2026, 10:56:38 p. m.     LOG [PrismaService] Prisma conectado exitosamente a PostgreSQL
[Nest] 14332  - 14/10/2026, 10:56:38 p. m.    WARN [PrismaService] No se pudo conectar a la base de datos al iniciar: Connection error
PASS src/modules/patients/application/use-cases/update-patient.use-case.spec.ts
PASS src/modules/identity/application/queries/get-clinic-profile.query.spec.ts
PASS src/shared/infrastructure/middleware/correlation-id.middleware.spec.ts
PASS src/shared/infrastructure/adapters/prisma-unit-of-work.adapter.spec.ts
PASS src/modules/identity/application/use-cases/update-user.use-case.spec.ts
PASS src/modules/patients/application/use-cases/create-patient.use-case.spec.ts
PASS src/modules/patients/application/use-cases/change-patient-status.use-case.spec.ts
PASS src/modules/identity/application/use-cases/login.use-case.spec.ts
PASS src/modules/identity/application/queries/list-clinic-users.query.spec.ts
PASS src/shared/infrastructure/adapters/system-clock.adapter.spec.ts
PASS src/modules/patients/application/queries/detect-duplicate-patients.query.spec.ts
PASS src/modules/identity/application/use-cases/create-user.use-case.spec.ts
PASS src/modules/patients/application/queries/get-patient-by-id.query.spec.ts
PASS src/shared/infrastructure/adapters/uuid-generator.adapter.spec.ts
PASS src/modules/identity/application/use-cases/logout.use-case.spec.ts
PASS src/modules/identity/application/use-cases/refresh-session.use-case.spec.ts
PASS src/shared/presentation/filters/domain-exception.filter.spec.ts
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_VALIDATION]: Mensaje para VALIDATION
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_UNAUTHORIZED]: Mensaje para UNAUTHORIZED
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_FORBIDDEN]: Mensaje para FORBIDDEN
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_NOT_FOUND]: Mensaje para NOT_FOUND
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_CONFLICT]: Mensaje para CONFLICT
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_INVARIANT_VIOLATION]: Mensaje para INVARIANT_VIOLATION
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-from-header] DomainError [RESOURCE_NOT_FOUND]: No encontrado
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [req-id-fallback] DomainError [CONFLICT_CODE]: Conflicto
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [unknown] DomainError [INVALID_INPUT]: Datos inválidos
[Nest] 14332  - 14/10/2026, 10:56:45 p. m.    WARN [DomainExceptionFilter] [corr-fallback-500] DomainError [UNKNOWN_ERR]: Error desconocido
PASS src/modules/patients/application/queries/list-patients.query.spec.ts
PASS src/modules/patients/application/queries/search-patients.query.spec.ts
PASS src/shared/infrastructure/logger/logger.redact.spec.ts
PASS src/modules/patients/domain/patient.entity.spec.ts
PASS src/modules/identity/domain/user.entity.spec.ts
PASS src/shared/infrastructure/sentry/sentry.sanitizer.spec.ts
PASS src/modules/identity/domain/clinic.entity.spec.ts
PASS src/modules/patients/domain/emergency-contact.vo.spec.ts
PASS src/modules/identity/domain/email.vo.spec.ts
PASS src/modules/identity/domain/refresh-session.entity.spec.ts
PASS src/modules/patients/domain/document-identity.vo.spec.ts
PASS src/shared/domain/domain-error.spec.ts
PASS src/modules/patients/domain/phone-number.vo.spec.ts
PASS src/shared/domain/aggregate-root.spec.ts
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
File                                              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
All files                                         |   96.81 |    91.22 |   94.16 |   96.57 |                                        
 src                                              |     100 |      100 |     100 |     100 |                                        
  configure-app.ts                                |     100 |      100 |     100 |     100 |                                        
 src/health                                       |     100 |      100 |     100 |     100 |                                        
  health.controller.ts                            |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/application/queries         |     100 |      100 |     100 |     100 |                                        
  get-authenticated-user.query.ts                 |     100 |      100 |     100 |     100 |                                        
  get-clinic-profile.query.ts                     |     100 |      100 |     100 |     100 |                                        
  list-clinic-users.query.ts                      |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/application/use-cases       |   99.43 |    96.55 |     100 |   99.38 |                                        
  change-user-status.use-case.ts                  |     100 |      100 |     100 |     100 |                                        
  create-user.use-case.ts                         |     100 |      100 |     100 |     100 |                                        
  login.use-case.ts                               |     100 |      100 |     100 |     100 |                                        
  logout.use-case.ts                              |     100 |      100 |     100 |     100 |                                        
  refresh-session.use-case.ts                     |   96.96 |    85.71 |     100 |   96.77 | 57                                     
  update-clinic-profile.use-case.ts               |     100 |      100 |     100 |     100 |                                        
  update-user.use-case.ts                         |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/domain                      |     100 |    97.14 |     100 |     100 |                                        
  clinic.entity.ts                                |     100 |      100 |     100 |     100 |                                        
  email.vo.ts                                     |     100 |      100 |     100 |     100 |                                        
  identity.errors.ts                              |     100 |        0 |     100 |     100 | 43                                     
  refresh-session.entity.ts                       |     100 |      100 |     100 |     100 |                                        
  role.enum.ts                                    |     100 |      100 |     100 |     100 |                                        
  user.entity.ts                                  |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/infrastructure/adapters     |     100 |      100 |     100 |     100 |                                        
  argon2-password-hasher.adapter.ts               |     100 |      100 |     100 |     100 |                                        
  jwt-token-service.adapter.ts                    |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/infrastructure/mappers      |     100 |       75 |     100 |     100 |                                        
  clinic.mapper.ts                                |     100 |       75 |     100 |     100 | 13                                     
  refresh-session.mapper.ts                       |     100 |      100 |     100 |     100 |                                        
  user.mapper.ts                                  |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/infrastructure/repositories |   94.56 |       96 |      88 |   93.67 |                                        
  in-memory-clinic.repository.ts                  |   88.88 |      100 |   66.66 |   85.71 | 19                                     
  in-memory-refresh-session.repository.ts         |   85.71 |      100 |      75 |   83.33 | 15,31                                  
  in-memory-user.repository.ts                    |   95.83 |      100 |      80 |   95.45 | 49                                     
  prisma-clinic.repository.ts                     |     100 |      100 |     100 |     100 |                                        
  prisma-refresh-session.repository.ts            |     100 |       50 |     100 |     100 | 15                                     
  prisma-user.repository.ts                       |   95.45 |      100 |     100 |   94.73 | 49                                     
 src/modules/identity/presentation                |   75.28 |        0 |      50 |   73.49 |                                        
  auth.controller.ts                              |   51.11 |        0 |       0 |   48.83 | 45-48,65-72,91-101,113-117,129,142-158 
  clinic.controller.ts                            |     100 |      100 |     100 |     100 |                                        
  users.controller.ts                             |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/presentation/dto            |     100 |      100 |     100 |     100 |                                        
  auth-response.dto.ts                            |     100 |      100 |     100 |     100 |                                        
  change-user-status.dto.ts                       |     100 |      100 |     100 |     100 |                                        
  clinic-profile.dto.ts                           |     100 |      100 |     100 |     100 |                                        
  create-user.dto.ts                              |     100 |      100 |     100 |     100 |                                        
  login.dto.ts                                    |     100 |      100 |     100 |     100 |                                        
  update-clinic.dto.ts                            |     100 |      100 |     100 |     100 |                                        
  update-user.dto.ts                              |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/application/queries         |     100 |    97.56 |     100 |     100 |                                        
  detect-duplicate-patients.query.ts              |     100 |      100 |     100 |     100 |                                        
  get-patient-by-id.query.ts                      |     100 |      100 |     100 |     100 |                                        
  list-patients.query.ts                          |     100 |      100 |     100 |     100 |                                        
  search-patients.query.ts                        |     100 |       90 |     100 |     100 | 23                                     
 src/modules/patients/application/use-cases       |     100 |      100 |     100 |     100 |                                        
  change-patient-status.use-case.ts               |     100 |      100 |     100 |     100 |                                        
  create-patient.use-case.ts                      |     100 |      100 |     100 |     100 |                                        
  update-patient.use-case.ts                      |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/domain                      |     100 |    95.55 |     100 |     100 |                                        
  acquisition-source.enum.ts                      |     100 |      100 |     100 |     100 |                                        
  document-identity.vo.ts                         |     100 |      100 |     100 |     100 |                                        
  document-type.enum.ts                           |     100 |      100 |     100 |     100 |                                        
  emergency-contact.vo.ts                         |     100 |      100 |     100 |     100 |                                        
  patient.entity.ts                               |     100 |     92.3 |     100 |     100 | 164,167                                
  patients.errors.ts                              |     100 |      100 |     100 |     100 |                                        
  phone-number.vo.ts                              |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/infrastructure/mappers      |     100 |      100 |     100 |     100 |                                        
  patient.mapper.ts                               |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/infrastructure/queries      |    92.7 |     75.8 |   93.75 |    92.3 |                                        
  in-memory-patient.queries.ts                    |   87.75 |    77.77 |    87.5 |    87.5 | 37,66,73,107-110                       
  prisma-patient.queries.ts                       |     100 |    79.16 |     100 |     100 | 39,102-114,117                         
  trigram-similarity.util.ts                      |      96 |    63.63 |     100 |   95.83 | 36                                     
 src/modules/patients/infrastructure/repositories |   92.53 |     87.8 |     100 |   92.06 |                                        
  in-memory-patient.repository.ts                 |   94.28 |    88.88 |     100 |   94.28 | 45,70                                  
  prisma-patient.repository.ts                    |   90.62 |    85.71 |     100 |   89.28 | 53,60,99                               
 src/modules/patients/presentation                |     100 |       50 |     100 |     100 |                                        
  patients.controller.ts                          |     100 |       50 |     100 |     100 | 108                                    
 src/modules/patients/presentation/dto            |     100 |      100 |     100 |     100 |                                        
  change-patient-status.dto.ts                    |     100 |      100 |     100 |     100 |                                        
  check-duplicates-query.dto.ts                   |     100 |      100 |     100 |     100 |                                        
  create-patient.dto.ts                           |     100 |      100 |     100 |     100 |                                        
  patient-response.dto.ts                         |     100 |      100 |     100 |     100 |                                        
  search-patients-query.dto.ts                    |     100 |      100 |     100 |     100 |                                        
  update-patient.dto.ts                           |     100 |      100 |     100 |     100 |                                        
 src/shared/domain                                |     100 |      100 |     100 |     100 |                                        
  aggregate-root.ts                               |     100 |      100 |     100 |     100 |                                        
  domain-error.ts                                 |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/adapters               |     100 |      100 |     100 |     100 |                                        
  nest-event-bus.adapter.ts                       |     100 |      100 |     100 |     100 |                                        
  prisma-unit-of-work.adapter.ts                  |     100 |      100 |     100 |     100 |                                        
  system-clock.adapter.ts                         |     100 |      100 |     100 |     100 |                                        
  uuid-generator.adapter.ts                       |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/logger                 |     100 |      100 |     100 |     100 |                                        
  logger.config.ts                                |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/middleware             |     100 |      100 |     100 |     100 |                                        
  correlation-id.middleware.ts                    |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/prisma                 |   96.29 |    81.81 |   85.71 |      96 |                                        
  prisma.service.ts                               |   96.29 |    81.81 |   85.71 |      96 | 36                                     
 src/shared/infrastructure/sentry                 |     100 |      100 |     100 |     100 |                                        
  sentry.sanitizer.ts                             |     100 |      100 |     100 |     100 |                                        
 src/shared/presentation/decorators               |   77.77 |      100 |      50 |   71.42 |                                        
  current-clinic.decorator.ts                     |      50 |      100 |       0 |      50 | 5-6                                    
  current-user.decorator.ts                       |      50 |      100 |       0 |      50 | 12-13                                  
  public.decorator.ts                             |     100 |      100 |     100 |     100 |                                        
  roles.decorator.ts                              |     100 |      100 |     100 |     100 |                                        
 src/shared/presentation/filters                  |     100 |      100 |     100 |     100 |                                        
  domain-exception.filter.ts                      |     100 |      100 |     100 |     100 |                                        
 src/shared/presentation/guards                   |     100 |      100 |     100 |     100 |                                        
  jwt-auth.guard.ts                               |     100 |      100 |     100 |     100 |                                        
  roles.guard.ts                                  |     100 |      100 |     100 |     100 |                                        
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------

Test Suites: 49 passed, 49 total
Tests:       225 passed, 225 total
Snapshots:   0 total
Time:        36.992 s, estimated 38 s
Ran all test suites.
```

### 2.5 `pnpm --filter backend test:e2e`
```text
$ jest --config ./test/jest-e2e.json
PASS test/auth.e2e-spec.ts (14.231 s)
PASS test/users-and-clinic.e2e-spec.ts
PASS test/patients.e2e-spec.ts
PASS test/health.e2e-spec.ts

Test Suites: 4 passed, 4 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        20.62 s
Ran all test suites.
```

---

## 3. Verificación de Base de Datos Real y Optimización GIN (`pg_trgm` + `unaccent`)

1. **Migración `20261014013000_fix_patients_restrict_and_trgm_unaccent` aplicada con `prisma migrate deploy`:**
   - Llave foránea `patients_clinic_id_fkey` actualizada con regla `ON DELETE RESTRICT ON UPDATE CASCADE` (`RF-B-010`, `RC-055`).
   - Extensión `unaccent` y función inmutable `immutable_unaccent(text)` creada para indexabilidad GIN.
   - Índice GIN funcional `patients_full_name_unaccent_trgm_idx` sobre `immutable_unaccent("first_name" || ' ' || "last_name")` creado exitosamente.
2. **Suites de Contrato sobre PostgreSQL Real (Cero Mocks de Prisma):**
   - `identity-repositories.contract.spec.ts`: 16 pruebas ejecutadas contra PostgreSQL y InMemory (incluyendo detección de error `P2002` por duplicidad de email).
   - `patients-repository.contract.spec.ts`: 14 pruebas ejecutadas contra PostgreSQL y InMemory (incluyendo colisión `P2002` y verificación de `onDelete: Restrict`).
   - `patients-queries.contract.spec.ts`: 8 pruebas ejecutadas contra PostgreSQL y InMemory, incluyendo inserción de 10.000 pacientes sintéticos con tiempo de consulta `< 300 ms` (66 ms) y verificación con `EXPLAIN ANALYZE` del uso del índice `patients_full_name_unaccent_trgm_idx`.

---

## 4. Verificación del Contrato OpenAPI (`openapi.json`)

Se ejecutó exitosamente `pnpm --filter backend openapi:generate` generando el endpoint:
- **Ruta:** `GET /v1/patients/search`
- **Parámetros Query:**
  - `q` (requerido, string): Término de búsqueda difusa por nombre, documento o teléfono.
  - `limit` (opcional, number, default 20): Límite de resultados a retornar (1 a 50).
  - `includeInactive` (opcional, boolean, default false): Incluir pacientes inactivos.
- **Respuesta 200:** Array de `PatientSearchResponseDto` con atributos del paciente y `similarityScore` numérico.
- **Seguridad:** Bearer JWT token requerido.
