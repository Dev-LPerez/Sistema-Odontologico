# Evidencia de Calidad y Trazabilidad - Change B-06 (add-patients-trigram-search)

Este documento certifica la implementación completa, verificación estricta y cumplimiento de los requisitos funcionales, no funcionales y de calidad para el Change **B-06 (`add-patients-trigram-search`)**.

- **Requisitos de Negocio Cubiertos:** `RF-B-012`, `RNF-B-004`, `RNF-B-005`, `RNF-B-009`, `RNF-B-031`, `RNF-B-032`, `RC-002`, `RC-005`, `RC-015`, `RC-018`, `RC-023`, `RC-031`.
- **Ruta Git / Rama:** `feat/add-patients-trigram-search`

---

## 1. Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto)

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Contrato | Archivo E2E (`Backend/test/patients.e2e-spec.ts`) | Estado |
| :--- | :--- | :--- | :--- |
| **Scenario:** Búsqueda exitosa por nombre con errores tipográficos para ADMIN o AUXILIARY | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por nombre tolerando errores tipográficos y ordenando por relevancia dentro del mismo clinicId')` | `it('debe permitir a ADMIN y AUXILIARY buscar pacientes tolerando errores tipográficos en GET /v1/patients/search (200)')` | ✅ PASA |
| **Scenario:** Búsqueda exitosa por fragmento de documento o teléfono con caracteres de formato | `search-patients.query.spec.ts` y `patients-queries.contract.spec.ts` -> `it('debe encontrar pacientes por fragmento de documento o teléfono normalizando guiones y espacios')` | `it('debe encontrar pacientes por fragmento de documento o teléfono en GET /v1/patients/search (200)')` | ✅ PASA |
| **Scenario:** Exclusión por defecto de pacientes inactivos e inclusión opcional en búsqueda | `patients-queries.contract.spec.ts` -> `it('debe excluir pacientes inactivos por defecto e incluirlos cuando includeInactive es true')` | `it('debe excluir pacientes inactivos por defecto e incluirlos con includeInactive=true en GET /v1/patients/search (200)')` | ✅ PASA |
| **Scenario:** Respuesta en menos de 300 ms sobre un catálogo de 10.000 pacientes | `patients-queries.contract.spec.ts` -> `it('debe responder en menos de 300 ms al buscar sobre 10.000 pacientes sintéticos (RNF-B-031, RC-031)')` | Cubierto en suite de contrato y benchmark con 10k pacientes sintéticos | ✅ PASA |

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

✔ no dependency violations found (178 modules, 730 dependencies cruised)
```

### 2.4 `pnpm --filter backend test:cov`
```text
$ jest --coverage
PASS src/modules/patients/domain/emergency-contact.vo.spec.ts (16.912 s)
PASS src/modules/identity/application/use-cases/create-user.use-case.spec.ts (18.947 s)
PASS src/shared/infrastructure/sentry/sentry.sanitizer.spec.ts
PASS src/modules/identity/application/use-cases/update-clinic-profile.use-case.spec.ts (19.198 s)
PASS src/shared/infrastructure/logger/logger.redact.spec.ts
PASS src/shared/infrastructure/adapters/nest-event-bus.adapter.spec.ts (20.279 s)
PASS src/shared/presentation/guards/roles.guard.spec.ts
PASS src/modules/identity/application/use-cases/change-user-status.use-case.spec.ts (21.689 s)
PASS src/shared/presentation/guards/jwt-auth.guard.spec.ts
PASS src/modules/identity/infrastructure/adapters/argon2-password-hasher.adapter.spec.ts
PASS src/modules/patients/application/queries/detect-duplicate-patients.query.spec.ts
PASS src/modules/patients/presentation/dto/search-patients-query.dto.spec.ts (23.251 s)
PASS src/modules/identity/infrastructure/adapters/jwt-token-service.adapter.spec.ts
PASS src/configure-app.spec.ts (23.353 s)
PASS src/modules/identity/application/use-cases/login.use-case.spec.ts
PASS src/health/health.controller.spec.ts (23.684 s)
PASS src/modules/identity/application/use-cases/update-user.use-case.spec.ts
PASS src/modules/identity/application/queries/get-clinic-profile.query.spec.ts
PASS src/modules/patients/application/use-cases/update-patient.use-case.spec.ts
PASS src/modules/identity/infrastructure/repositories/identity-repositories.contract.spec.ts
PASS src/modules/patients/application/use-cases/create-patient.use-case.spec.ts
PASS src/shared/infrastructure/prisma/prisma.service.spec.ts
PASS src/modules/patients/application/use-cases/change-patient-status.use-case.spec.ts
[Nest] 4708  - 14/10/2026, 9:14:34 p. m.     LOG [PrismaService] Prisma conectado exitosamente a PostgreSQL
[Nest] 4708  - 14/10/2026, 9:14:34 p. m.    WARN [PrismaService] No se pudo conectar a la base de datos al iniciar: Connection error
PASS src/modules/patients/infrastructure/repositories/patients-repository.contract.spec.ts
PASS src/shared/infrastructure/adapters/prisma-unit-of-work.adapter.spec.ts
PASS src/modules/patients/application/queries/get-patient-by-id.query.spec.ts
PASS src/modules/identity/presentation/clinic.controller.spec.ts (25.641 s)
PASS src/shared/infrastructure/middleware/correlation-id.middleware.spec.ts
PASS src/shared/presentation/filters/domain-exception.filter.spec.ts
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_VALIDATION]: Mensaje para VALIDATION
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_UNAUTHORIZED]: Mensaje para UNAUTHORIZED
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_FORBIDDEN]: Mensaje para FORBIDDEN
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_NOT_FOUND]: Mensaje para NOT_FOUND
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_CONFLICT]: Mensaje para CONFLICT
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_INVARIANT_VIOLATION]: Mensaje para INVARIANT_VIOLATION
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-from-header] DomainError [RESOURCE_NOT_FOUND]: No encontrado
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [req-id-fallback] DomainError [CONFLICT_CODE]: Conflicto
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [unknown] DomainError [INVALID_INPUT]: Datos inválidos
[Nest] 1228  - 14/10/2026, 9:14:35 p. m.    WARN [DomainExceptionFilter] [corr-fallback-500] DomainError [UNKNOWN_ERR]: Error desconocido
PASS src/modules/identity/presentation/users.controller.spec.ts (25.942 s)
PASS src/modules/identity/application/use-cases/logout.use-case.spec.ts
PASS src/modules/identity/application/use-cases/refresh-session.use-case.spec.ts
PASS src/modules/identity/application/queries/get-authenticated-user.query.spec.ts
PASS src/modules/patients/domain/document-identity.vo.spec.ts
PASS src/modules/identity/domain/clinic.entity.spec.ts
PASS src/modules/identity/application/queries/list-clinic-users.query.spec.ts
PASS src/shared/infrastructure/adapters/system-clock.adapter.spec.ts
PASS src/modules/patients/presentation/patients.controller.spec.ts (26.509 s)
PASS src/modules/identity/domain/user.entity.spec.ts
PASS src/shared/infrastructure/adapters/uuid-generator.adapter.spec.ts
PASS src/modules/patients/domain/phone-number.vo.spec.ts
PASS src/modules/patients/application/queries/search-patients.query.spec.ts
PASS src/modules/patients/application/queries/list-patients.query.spec.ts
PASS src/modules/patients/domain/patient.entity.spec.ts
PASS src/modules/identity/domain/email.vo.spec.ts
PASS src/shared/domain/aggregate-root.spec.ts
PASS src/shared/domain/domain-error.spec.ts
PASS src/modules/identity/domain/refresh-session.entity.spec.ts
PASS src/modules/patients/infrastructure/queries/patients-queries.contract.spec.ts (10.093 s)
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
File                                              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
All files                                         |   96.98 |    91.16 |   94.53 |   96.74 |                                        
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
 src/modules/identity/infrastructure/mappers      |     100 |       50 |     100 |     100 |                                        
  clinic.mapper.ts                                |     100 |       50 |     100 |     100 | 13-27                                  
  refresh-session.mapper.ts                       |     100 |      100 |     100 |     100 |                                        
  user.mapper.ts                                  |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/infrastructure/repositories |   95.12 |    94.73 |      88 |    94.2 |                                        
  in-memory-clinic.repository.ts                  |   88.88 |      100 |   66.66 |   85.71 | 19                                     
  in-memory-refresh-session.repository.ts         |   85.71 |      100 |      75 |   83.33 | 15,31                                  
  in-memory-user.repository.ts                    |      95 |      100 |      80 |   94.44 | 42                                     
  prisma-clinic.repository.ts                     |     100 |      100 |     100 |     100 |                                        
  prisma-refresh-session.repository.ts            |     100 |       50 |     100 |     100 | 15                                     
  prisma-user.repository.ts                       |     100 |      100 |     100 |     100 |                                        
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
 src/modules/patients/infrastructure/queries      |   92.78 |    76.56 |   93.75 |   92.39 |                                        
  in-memory-patient.queries.ts                    |   87.75 |    79.31 |    87.5 |    87.5 | 37,66,73,107-110                       
  prisma-patient.queries.ts                       |     100 |    79.16 |     100 |     100 | 39,105-117,120                         
  trigram-similarity.util.ts                      |      96 |    63.63 |     100 |   95.83 | 36                                     
 src/modules/patients/infrastructure/repositories |   92.98 |    84.84 |     100 |   92.45 |                                        
  in-memory-patient.repository.ts                 |   93.54 |    86.36 |     100 |   93.54 | 44,69                                  
  prisma-patient.repository.ts                    |    92.3 |    81.81 |     100 |    90.9 | 52,59                                  
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
 src/shared/infrastructure/prisma                 |     100 |      100 |     100 |     100 |                                        
  prisma.service.ts                               |     100 |      100 |     100 |     100 |                                        
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
Tests:       219 passed, 219 total
Snapshots:   0 total
Time:        38.91 s
Ran all test suites.
```

### 2.5 `pnpm --filter backend test:e2e`
```text
$ jest --config ./test/jest-e2e.json
PASS test/health.e2e-spec.ts (17.047 s)
PASS test/users-and-clinic.e2e-spec.ts (18.143 s)
PASS test/auth.e2e-spec.ts (19.452 s)
PASS test/patients.e2e-spec.ts (19.962 s)

Test Suites: 4 passed, 4 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        22.488 s, estimated 442 s
Ran all test suites.
```

---

## 3. Verificación del Contrato OpenAPI (`openapi.json`)

Se ejecutó exitosamente `pnpm --filter backend openapi:generate` generando el endpoint:
- **Ruta:** `GET /v1/patients/search`
- **Parámetros Query:**
  - `q` (requerido, string): Término de búsqueda difusa por nombre, documento o teléfono.
  - `limit` (opcional, number, default 20): Límite de resultados a retornar (1 a 50).
  - `includeInactive` (opcional, boolean, default false): Incluir pacientes inactivos.
- **Respuesta 200:** Array de `PatientSearchResponseDto` con atributos del paciente y `similarityScore` numérico.
- **Seguridad:** Bearer JWT token requerido.
