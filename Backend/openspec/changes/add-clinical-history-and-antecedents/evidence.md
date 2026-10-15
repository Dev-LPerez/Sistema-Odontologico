# Evidencia de Calidad y Pruebas - Change: add-clinical-history-and-antecedents (B-08)

## 1. Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto 1:1)

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Contrato (PostgreSQL Real + InMemory) | Archivo E2E (`Backend/test/clinical-history.e2e-spec.ts`) | Estado |
| :--- | :--- | :--- | :--- |
| **Scenario:** Administradora abre y actualiza la historia clínica con antecedentes y auxiliar puede consultarla | `create-clinical-history.use-case.spec.ts`, `update-clinical-history.use-case.spec.ts` y `clinical-history-repository.contract.spec.ts` -> `it('debe crear, actualizar y consultar la historia clínica con antecedentes y diagnósticos aislando por clinicId')` | `it('debe permitir a ADMIN abrir y actualizar la historia clínica con antecedentes y a AUXILIARY consultarla (201/200)')` | **PASSED** |
| **Scenario:** Rechazo de segunda historia clínica para el mismo paciente en el consultorio | `create-clinical-history.use-case.spec.ts` y `clinical-history-repository.contract.spec.ts` -> `it('debe lanzar DuplicateClinicalHistoryError (409) cuando el paciente ya tiene historia clínica en el consultorio (P2002)')` | `it('debe rechazar con 409 DUPLICATE_CLINICAL_HISTORY cuando se intenta abrir una segunda historia clínica para el mismo paciente')` | **PASSED** |
| **Scenario:** Rechazo cuando se marca alergia o medicación activa sin especificar el detalle | `medical-antecedents.vo.spec.ts` y `clinical-history.entity.spec.ts` -> `it('debe lanzar InvalidClinicalHistoryDataError cuando allergies o medications es true sin detalle o chiefComplaint está vacío')` | `it('debe rechazar con 400 INVALID_CLINICAL_HISTORY_DATA cuando se marca alergia sin detalle o motivo de consulta vacío')` | **PASSED** |
| **Scenario:** Bloqueo a rol AUXILIARY al intentar abrir o modificar la historia clínica o el plan de tratamiento | `roles.guard.spec.ts` (cubierto en pruebas unitarias) | `it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta crear o modificar la historia clínica o el plan de tratamiento')` | **PASSED** |
| **Scenario:** Adición de ítem al plan de tratamiento resolviendo precio del catálogo y cambio de estado a COMPLETED | `add-treatment-plan-item.use-case.spec.ts`, `update-treatment-plan-item-status.use-case.spec.ts` y `clinical-history-repository.contract.spec.ts` -> `it('debe agregar ítems al plan de tratamiento resolviendo el costo y actualizar su estado a COMPLETED calculando totalEstimatedCostCop')` | `it('debe permitir a ADMIN agregar un ítem al plan de tratamiento resolviendo el precio del catálogo y actualizar su estado a COMPLETED (201/200)')` | **PASSED** |

---

## 2. Salidas Literales de Consola de Verificación

### 2.1 Lint (`pnpm --filter backend lint`)
```text
> backend@0.0.1 lint C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> eslint "{src,test}/**/*.ts" --max-warnings 0
```

### 2.2 Typecheck (`pnpm --filter backend typecheck`)
```text
> backend@0.0.1 typecheck C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> tsc --noEmit
```

### 2.3 Dependency Cruiser (`pnpm --filter backend deps:check`)
```text
> backend@0.0.1 deps:check C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> depcruise --config .dependency-cruiser.js src

✔ no dependency violations found (258 modules, 1172 dependencies cruised)
```

### 2.4 Test Coverage (`pnpm --filter backend test:cov`)
```text
> backend@0.0.1 test:cov C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> jest --coverage

PASS src/modules/clinical/presentation/clinical-history.controller.spec.ts (9.247 s)
PASS src/modules/clinical/application/use-cases/create-clinical-history.use-case.spec.ts
PASS src/modules/clinical/application/use-cases/update-clinical-history.use-case.spec.ts
PASS src/modules/patients/infrastructure/queries/patients-queries.contract.spec.ts
PASS src/modules/catalogs/infrastructure/repositories/catalogs-repositories.contract.spec.ts
PASS src/modules/clinical/infrastructure/repositories/clinical-history-repository.contract.spec.ts
PASS src/modules/clinical/application/use-cases/add-treatment-plan-item.use-case.spec.ts
PASS src/modules/catalogs/presentation/catalogs.controller.spec.ts
PASS src/modules/patients/infrastructure/repositories/patients-repository.contract.spec.ts
PASS src/modules/catalogs/application/use-cases/set-patient-procedure-price.use-case.spec.ts
PASS src/modules/patients/presentation/patients.controller.spec.ts
PASS src/configure-app.spec.ts
PASS src/modules/identity/presentation/users.controller.spec.ts
PASS src/modules/identity/infrastructure/repositories/identity-repositories.contract.spec.ts
PASS src/modules/identity/presentation/clinic.controller.spec.ts
PASS src/modules/identity/infrastructure/adapters/argon2-password-hasher.adapter.spec.ts
PASS src/modules/patients/presentation/dto/search-patients-query.dto.spec.ts
PASS src/health/health.controller.spec.ts
PASS src/shared/presentation/guards/jwt-auth.guard.spec.ts
PASS src/modules/catalogs/application/use-cases/create-material.use-case.spec.ts
PASS src/modules/identity/application/use-cases/change-user-status.use-case.spec.ts
PASS src/shared/presentation/guards/roles.guard.spec.ts
PASS src/shared/infrastructure/prisma/prisma.service.spec.ts
[Nest] 3896  - 15/10/2026, 3:28:42 p. m.     LOG [PrismaService] Prisma conectado exitosamente a PostgreSQL
[Nest] 3896  - 15/10/2026, 3:28:42 p. m.    WARN [PrismaService] No se pudo conectar a la base de datos al iniciar: Connection error
PASS src/shared/infrastructure/adapters/nest-event-bus.adapter.spec.ts
PASS src/modules/identity/infrastructure/adapters/jwt-token-service.adapter.spec.ts
PASS src/modules/identity/application/use-cases/login.use-case.spec.ts
PASS src/modules/clinical/application/queries/get-clinical-history-by-patient.query.spec.ts
PASS src/shared/infrastructure/adapters/prisma-unit-of-work.adapter.spec.ts
PASS src/shared/presentation/filters/domain-exception.filter.spec.ts
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_VALIDATION]: Mensaje para VALIDATION
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_UNAUTHORIZED]: Mensaje para UNAUTHORIZED
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_FORBIDDEN]: Mensaje para FORBIDDEN
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_NOT_FOUND]: Mensaje para NOT_FOUND
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_CONFLICT]: Mensaje para CONFLICT
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-xyz-789] DomainError [ERR_INVARIANT_VIOLATION]: Mensaje para INVARIANT_VIOLATION
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-from-header] DomainError [RESOURCE_NOT_FOUND]: No encontrado
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [req-id-fallback] DomainError [CONFLICT_CODE]: Conflicto
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [unknown] DomainError [INVALID_INPUT]: Datos inválidos
[Nest] 3896  - 15/10/2026, 3:28:45 p. m.    WARN [DomainExceptionFilter] [corr-fallback-500] DomainError [UNKNOWN_ERR]: Error desconocido
PASS src/modules/identity/application/use-cases/update-clinic-profile.use-case.spec.ts
PASS src/modules/patients/application/queries/get-patient-by-id.query.spec.ts
PASS src/modules/identity/application/use-cases/create-user.use-case.spec.ts
PASS src/modules/identity/application/use-cases/refresh-session.use-case.spec.ts
PASS src/shared/infrastructure/middleware/correlation-id.middleware.spec.ts
PASS src/modules/identity/application/queries/get-authenticated-user.query.spec.ts
PASS src/modules/catalogs/application/use-cases/update-procedure.use-case.spec.ts
PASS src/modules/catalogs/application/use-cases/consume-material-stock.use-case.spec.ts
PASS src/modules/patients/application/use-cases/update-patient.use-case.spec.ts
PASS src/modules/patients/application/use-cases/create-patient.use-case.spec.ts
PASS src/modules/patients/application/queries/detect-duplicate-patients.query.spec.ts
PASS src/modules/patients/application/queries/list-patients.query.ts
PASS src/modules/catalogs/application/use-cases/create-procedure.use-case.spec.ts
PASS src/modules/identity/application/use-cases/logout.use-case.spec.ts
PASS src/modules/identity/application/queries/get-clinic-profile.query.spec.ts
PASS src/modules/identity/application/queries/list-clinic-users.query.spec.ts
PASS src/modules/catalogs/application/use-cases/update-material.use-case.spec.ts
PASS src/modules/catalogs/application/queries/list-patient-procedure-prices.query.spec.ts
PASS src/modules/patients/application/queries/search-patients.query.spec.ts
PASS src/modules/clinical/application/use-cases/update-treatment-plan-item-status.use-case.spec.ts
PASS src/modules/patients/application/use-cases/change-patient-status.use-case.spec.ts
PASS src/modules/identity/application/use-cases/update-user.use-case.spec.ts
PASS src/modules/catalogs/application/queries/list-materials.query.spec.ts
PASS src/shared/infrastructure/adapters/uuid-generator.adapter.spec.ts
PASS src/modules/catalogs/application/queries/list-procedures.query.spec.ts
PASS src/shared/infrastructure/adapters/system-clock.adapter.spec.ts
PASS src/modules/clinical/domain/clinical-history.entity.spec.ts
PASS src/shared/infrastructure/logger/logger.redact.spec.ts
PASS src/modules/patients/domain/document-identity.vo.spec.ts
PASS src/modules/catalogs/domain/money.vo.spec.ts
PASS src/modules/identity/domain/email.vo.spec.ts
PASS src/modules/catalogs/domain/patient-procedure-price.entity.spec.ts
PASS src/modules/catalogs/domain/procedure.entity.spec.ts
PASS src/modules/catalogs/domain/material.entity.spec.ts
PASS src/modules/clinical/domain/treatment-plan-item.entity.spec.ts
PASS src/modules/patients/domain/patient.entity.spec.ts
PASS src/shared/infrastructure/sentry/sentry.sanitizer.spec.ts
PASS src/modules/identity/domain/user.entity.spec.ts
PASS src/modules/identity/domain/clinic.entity.spec.ts
PASS src/modules/clinical/domain/medical-antecedents.vo.spec.ts
PASS src/modules/patients/domain/emergency-contact.vo.spec.ts
PASS src/modules/patients/domain/phone-number.vo.spec.ts
PASS src/shared/domain/aggregate-root.spec.ts
PASS src/modules/identity/domain/refresh-session.entity.spec.ts
PASS src/shared/domain/domain-error.spec.ts
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
File                                              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
All files                                         |   97.82 |    91.71 |   95.73 |   97.67 |                                        
 src                                              |     100 |      100 |     100 |     100 |                                        
  configure-app.ts                                |     100 |      100 |     100 |     100 |                                        
 src/health                                       |     100 |      100 |     100 |     100 |                                        
  health.controller.ts                            |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/application/queries         |     100 |      100 |     100 |     100 |                                        
  list-materials.query.ts                         |     100 |      100 |     100 |     100 |                                        
  list-patient-procedure-prices.query.ts          |     100 |      100 |     100 |     100 |                                        
  list-procedures.query.ts                        |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/application/use-cases       |     100 |      100 |     100 |     100 |                                        
  consume-material-stock.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  create-material.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
  create-procedure.use-case.ts                    |     100 |      100 |     100 |     100 |                                        
  set-patient-procedure-price.use-case.ts         |     100 |      100 |     100 |     100 |                                        
  update-material.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
  update-procedure.use-case.ts                    |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/domain                      |     100 |      100 |     100 |     100 |                                        
  catalogs.errors.ts                              |     100 |      100 |     100 |     100 |                                        
  material.entity.ts                              |     100 |      100 |     100 |     100 |                                        
  money.vo.ts                                     |     100 |      100 |     100 |     100 |                                        
  patient-procedure-price.entity.ts               |     100 |      100 |     100 |     100 |                                        
  procedure.entity.ts                             |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/infrastructure/mappers      |     100 |      100 |     100 |     100 |                                        
  material.mapper.ts                              |     100 |      100 |     100 |     100 |                                        
  patient-procedure-price.mapper.ts               |     100 |      100 |     100 |     100 |                                        
  procedure.mapper.ts                             |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/infrastructure/repositories |   98.59 |    87.01 |     100 |   98.38 |                                        
  in-memory-material.repository.ts                |     100 |    86.95 |     100 |     100 | 10,30-33                               
  in-memory-patient-procedure-price.repository.ts |     100 |     92.3 |     100 |     100 | 15                                     
  in-memory-procedure.repository.ts               |     100 |    94.73 |     100 |     100 | 19                                     
  prisma-material.repository.ts                   |   95.45 |       70 |     100 |   94.73 | 69                                     
  prisma-patient-procedure-price.repository.ts    |     100 |       50 |     100 |     100 | 26                                     
  prisma-procedure.repository.ts                  |   95.83 |       90 |     100 |   95.23 | 63                                     
 src/modules/catalogs/presentation                |     100 |      100 |     100 |     100 |                                        
  catalogs.controller.ts                          |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/presentation/dto            |   97.59 |        0 |      60 |   97.59 |                                        
  material.dto.ts                                 |   97.29 |        0 |      50 |   97.29 | 103                                    
  patient-procedure-price.dto.ts                  |     100 |      100 |     100 |     100 |                                        
  procedure.dto.ts                                |   96.29 |        0 |      50 |   96.29 | 75                                     
 src/modules/clinical/application/queries         |     100 |      100 |     100 |     100 |                                        
  get-clinical-history-by-patient.query.ts        |     100 |      100 |     100 |     100 |                                        
 src/modules/clinical/application/use-cases       |     100 |    96.55 |     100 |     100 |                                        
  add-treatment-plan-item.use-case.ts             |     100 |      100 |     100 |     100 |                                        
  create-clinical-history.use-case.ts             |     100 |    92.85 |     100 |     100 | 42                                     
  update-clinical-history.use-case.ts             |     100 |      100 |     100 |     100 |                                        
  update-treatment-plan-item-status.use-case.ts   |     100 |      100 |     100 |     100 |                                        
 src/modules/clinical/domain                      |     100 |    98.27 |     100 |     100 |                                        
  clinical-history.entity.ts                      |     100 |      100 |     100 |     100 |                                        
  clinical.errors.ts                              |     100 |      100 |     100 |     100 |                                        
  medical-antecedents.vo.ts                       |     100 |      100 |     100 |     100 |                                        
  treatment-item-status.enum.ts                   |     100 |      100 |     100 |     100 |                                        
  treatment-plan-item.entity.ts                   |     100 |    94.11 |     100 |     100 | 68                                     
 src/modules/clinical/infrastructure/mappers      |     100 |       75 |     100 |     100 |                                        
  clinical-history.mapper.ts                      |     100 |       75 |     100 |     100 | 18,39-56                               
 src/modules/clinical/infrastructure/repositories |   94.59 |    88.23 |     100 |   94.28 |                                        
  in-memory-clinical-history.repository.ts        |   93.75 |       90 |     100 |   93.75 | 11                                     
  prisma-clinical-history.repository.ts           |   95.23 |    85.71 |     100 |   94.73 | 75                                     
 src/modules/clinical/presentation                |     100 |      100 |     100 |     100 |                                        
  clinical-history.controller.ts                  |     100 |      100 |     100 |     100 |                                        
 src/modules/clinical/presentation/dto            |    96.7 |      100 |      40 |    96.7 |                                        
  add-treatment-plan-item.dto.ts                  |     100 |      100 |     100 |     100 |                                        
  clinical-history-response.dto.ts                |   96.87 |      100 |   66.66 |   96.87 | 125                                    
  create-clinical-history.dto.ts                  |    92.3 |      100 |       0 |    92.3 | 26                                     
  medical-antecedents.dto.ts                      |     100 |      100 |     100 |     100 |                                        
  update-clinical-history.dto.ts                  |   91.66 |      100 |       0 |   91.66 | 28                                     
  update-treatment-item-status.dto.ts             |     100 |      100 |     100 |     100 |                                        
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

Test Suites: 74 passed, 74 total
Tests:       371 passed, 371 total
Snapshots:   0 total
Time:        53.829 s, estimated 69 s
Ran all test suites.
```

### 2.5 Test E2E (`pnpm --filter backend test:e2e`)
```text
> backend@0.0.1 test:e2e C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> jest --config ./test/jest-e2e.json

PASS test/auth.e2e-spec.ts (14.981 s)
PASS test/catalogs.e2e-spec.ts
PASS test/users-and-clinic.e2e-spec.ts
PASS test/clinical-history.e2e-spec.ts
PASS test/patients.e2e-spec.ts
PASS test/health.e2e-spec.ts

Test Suites: 6 passed, 6 total
Tests:       55 passed, 55 total
Snapshots:   0 total
Time:        26.761 s
Ran all test suites.
```
