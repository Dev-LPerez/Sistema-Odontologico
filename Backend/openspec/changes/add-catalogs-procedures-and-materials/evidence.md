# Evidencia de Calidad y Pruebas - Change: add-catalogs-procedures-and-materials (B-07)

## 1. Matriz de Trazabilidad Completada (Spec Scenario -> Test Concreto)

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Caso de Uso | Archivo E2E (`Backend/test/catalogs.e2e-spec.ts`) | Estado |
| :--- | :--- | :--- | :--- |
| **Scenario:** Administradora crea y actualiza un procedimiento y auxiliar puede listarlo (RF-B-050) | `create-procedure.use-case.spec.ts` -> `it('should create an active procedure with base price COP')`, `update-procedure.use-case.spec.ts` -> `it('should update procedure properties')`, `list-procedures.query.spec.ts` -> `it('should list procedures by clinicId')` | `it('ADMIN should create procedure with 201 Created and update it with 200 OK')`, `it('AUXILIARY should list procedures and patient custom prices with 200 OK')` | **PASSED** |
| **Scenario:** Rechazo de procedimiento con código duplicado en el mismo consultorio (RF-B-050) | `create-procedure.use-case.spec.ts` -> `it('should throw DuplicateProcedureCodeError when code already exists in clinic')` | `it('ADMIN should receive 409 Conflict when creating procedure with duplicate code')` | **PASSED** |
| **Scenario:** Bloqueo a rol AUXILIARY al intentar crear o modificar procedimientos o materiales (RC-005) | `roles.guard.spec.ts` (pruebas unitarias del guard de roles) | `it('AUXILIARY should be rejected with 403 Forbidden on POST /catalogs/procedures')`, `it('AUXILIARY should be rejected with 403 Forbidden on PATCH /catalogs/procedures/:id')`, `it('AUXILIARY should be rejected with 403 Forbidden on PUT /catalogs/patient-prices')`, `it('AUXILIARY should be rejected with 403 Forbidden on POST /catalogs/materials')`, `it('AUXILIARY should be rejected with 403 Forbidden on PATCH /catalogs/materials/:id')` | **PASSED** |
| **Scenario:** Configuración y consulta de precio especial por paciente con motivo (RF-B-051) | `set-patient-procedure-price.use-case.spec.ts` -> `it('should create or update a patient custom price with mandatory reason')`, `list-patient-procedure-prices.query.spec.ts` -> `it('should list all custom prices for a patient in clinic')` | `it('ADMIN should set custom price with 200 OK and list it for the patient')` | **PASSED** |
| **Scenario:** Rechazo de ajuste de precio por paciente cuando el motivo está vacío (RF-B-051) | `patient-procedure-price.entity.spec.ts` -> `it('should throw PatientPriceReasonRequiredError when reason is empty or whitespace')` | `it('ADMIN should receive 400 Bad Request when reason is empty or whitespace')` | **PASSED** |
| **Scenario:** Registro de material propio y activación de alerta de bajo stock tras descuento (RF-B-052, RF-B-053) | `create-material.use-case.spec.ts` -> `it('should create material with natural key and calculate initial stock status')`, `consume-material-stock.use-case.spec.ts` -> `it('should consume stock and recalculate low stock flag')` | `it('ADMIN should create material with 201 Created and isLowStock false')`, `it('AUXILIARY should consume 2 units, reducing stock to 1 and setting isLowStock to true')` | **PASSED** |
| **Scenario:** Rechazo de descuento de material cuando las existencias son insuficientes (RF-B-053) | `material.entity.spec.ts` -> `it('should throw InsufficientMaterialStockError when consuming more than currentStock')`, `consume-material-stock.use-case.spec.ts` -> `it('should reject consumption if stock is insufficient')` | `it('should receive 422 Unprocessable Entity when consuming more than available stock')` | **PASSED** |

---

## 2. Salidas Literales de Consola de Verificación

### 2.1 Lint (`pnpm --filter backend lint`)
```text
$ eslint "{src,test}/**/*.ts" --max-warnings 0
```
*(Salida con código 0, cero errores y cero advertencias).*

### 2.2 Typecheck (`pnpm --filter backend typecheck`)
```text
$ tsc --noEmit
```
*(Salida con código 0, cero errores de tipos TypeScript).*

### 2.3 Dependency Cruiser (`pnpm --filter backend deps:check`)
```text
$ depcruise --config .dependency-cruiser.js src

✔ no dependency violations found (225 modules, 986 dependencies cruised)
```

### 2.4 Test Coverage (`pnpm --filter backend test:cov`)
```text
$ jest --coverage
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
File                                              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
--------------------------------------------------|---------|----------|---------|---------|----------------------------------------
All files                                         |   97.29 |    89.62 |   95.75 |   97.09 |                                        
 src                                              |     100 |      100 |     100 |     100 |                                        
  configure-app.ts                                |     100 |      100 |     100 |     100 |                                        
 src/health                                       |     100 |      100 |     100 |     100 |                                        
  health.controller.ts                            |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/application/queries         |     100 |      100 |     100 |     100 |                                        
  list-materials.query.ts                         |     100 |      100 |     100 |     100 |                                        
  list-patient-procedure-prices.query.ts          |     100 |      100 |     100 |     100 |                                        
  list-procedures.query.ts                        |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/application/use-cases       |     100 |     90.9 |     100 |     100 |                                        
  consume-material-stock.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  create-material.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
  create-procedure.use-case.ts                    |     100 |      100 |     100 |     100 |                                        
  set-patient-procedure-price.use-case.ts         |     100 |      100 |     100 |     100 |                                        
  update-material.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
  update-procedure.use-case.ts                    |     100 |    66.66 |     100 |     100 | 36                                     
 src/modules/catalogs/domain                      |   97.86 |    90.62 |     100 |   97.86 |                                        
  catalogs.errors.ts                              |     100 |      100 |     100 |     100 |                                        
  material.entity.ts                              |   98.43 |    91.66 |     100 |   98.43 | 31                                     
  money.vo.ts                                     |    90.9 |     87.5 |     100 |    90.9 | 28                                     
  patient-procedure-price.entity.ts               |   97.22 |    91.66 |     100 |   97.22 | 31                                     
  procedure.entity.ts                             |   97.67 |    88.88 |     100 |   97.67 | 34                                     
 src/modules/catalogs/infrastructure/mappers      |     100 |      100 |     100 |     100 |                                        
  material.mapper.ts                              |     100 |      100 |     100 |     100 |                                        
  patient-procedure-price.mapper.ts               |     100 |      100 |     100 |     100 |                                        
  procedure.mapper.ts                             |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/infrastructure/repositories |   97.18 |    84.41 |     100 |   96.77 |                                        
  in-memory-material.repository.ts                |   97.14 |     82.6 |     100 |   96.77 | 64                                     
  in-memory-patient-procedure-price.repository.ts |     100 |     92.3 |     100 |     100 | 15                                     
  in-memory-procedure.repository.ts               |   96.66 |    89.47 |     100 |      96 | 42                                     
  prisma-material.repository.ts                   |   95.45 |       70 |     100 |   94.73 | 69                                     
  prisma-patient-procedure-price.repository.ts    |     100 |       50 |     100 |     100 | 26                                     
  prisma-procedure.repository.ts                  |   95.83 |       90 |     100 |   95.23 | 63                                     
 src/modules/catalogs/presentation                |     100 |      100 |     100 |     100 |                                        
  catalogs.controller.ts                          |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/presentation/dto            |   97.59 |        0 |      60 |   97.59 |                                        
  material.dto.ts                                 |   97.29 |        0 |      50 |   97.29 | 103                                    
  patient-procedure-price.dto.ts                  |     100 |      100 |     100 |     100 |                                        
  procedure.dto.ts                                |   96.29 |        0 |      50 |   96.29 | 75                                     
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

Test Suites: 64 passed, 64 total
Tests:       307 passed, 307 total
Snapshots:   0 total
Time:        50.006 s
Ran all test suites.
```

### 2.5 Pruebas de Integración E2E (`pnpm --filter backend test:e2e`)
```text
$ jest --config ./test/jest-e2e.json
PASS test/auth.e2e-spec.ts
PASS test/catalogs.e2e-spec.ts
PASS test/users-and-clinic.e2e-spec.ts
PASS test/patients.e2e-spec.ts
PASS test/health.e2e-spec.ts

Test Suites: 5 passed, 5 total
Tests:       56 passed, 56 total
Snapshots:   0 total
Time:        19.817 s
Ran all test suites.
```

---

## 3. Verificación de Criterios de Calidad

- [x] **RC-001 y RC-002 (Cobertura):** >= 80% global (obtenido 97.29% stmts, 89.62% branches, 97.09% lines) y >= 90% en `catalogs/domain` (97.86% stmts, 90.62% branches) y `catalogs/application` (100% stmts, 90.9% branches).
- [x] **RC-005 (Permisos por rol):** Validado en `catalogs.e2e-spec.ts` con bloqueo `403 FORBIDDEN_ROLE` a `AUXILIARY` en endpoints de escritura y autorización en endpoints de lectura y consumo.
- [x] **RC-010 (Lint y formato):** 0 errores y 0 advertencias de ESLint y Prettier.
- [x] **RC-011 (TypeScript estricto):** Sin `any` explícito y `tsc --noEmit` exitoso.
- [x] **RC-012 y RC-017 (Fronteras y Clean Architecture):** 0 violaciones reportadas por `dependency-cruiser` (225 módulos). Consumo del repositorio de pacientes exclusivamente a través del puerto público de `modules/patients`.
- [x] **RC-018 y RC-050 (Suites de contrato en PostgreSQL real):** Ejecutadas contra `InMemory` y contenedor Docker `PostgreSQL` real en `catalogs-repositories.contract.spec.ts`.
- [x] **RC-055 (onDelete: Restrict):** Validado en base de datos real con prueba explícita de restricción por clave foránea al intentar eliminar registros padres vinculados.
- [x] **RC-070 (OpenAPI):** Archivo `Backend/openapi.json` regenerado e integrado.
