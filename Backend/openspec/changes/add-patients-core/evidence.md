# Evidencia de Calidad y Pruebas - Change: add-patients-core

## 1. Matriz de Trazabilidad Completada (Spec Scenario -> Test Concreto)

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Caso de Uso | Archivo E2E (`Backend/test/patients.e2e-spec.ts`) | Estado |
| :--- | :--- | :--- | :--- |
| **Scenario:** Registro exitoso de paciente con consentimiento Ley 1581 por doctora o auxiliar | `create-patient.use-case.spec.ts` -> `it('debe registrar un paciente activo con consentimiento Ley 1581 y asignar dataTreatmentConsentAt')` | `it('debe permitir a ADMIN y AUXILIARY registrar un paciente con consentimiento Ley 1581 (201)')` | **PASSED** |
| **Scenario:** Rechazo de creación de paciente cuando no se otorga el consentimiento Ley 1581 | `patient.entity.spec.ts` y `create-patient.use-case.spec.ts` -> `it('debe lanzar DataTreatmentConsentRequiredError cuando dataTreatmentConsent es false')` | `it('debe rechazar con 422 DATA_TREATMENT_CONSENT_REQUIRED cuando dataTreatmentConsent es false')` | **PASSED** |
| **Scenario:** Rechazo por documento de identidad duplicado en el mismo consultorio | `create-patient.use-case.spec.ts` -> `it('debe lanzar DuplicatePatientDocumentError si ya existe un paciente con el mismo tipo y número de documento en el consultorio')` | `it('debe rechazar con 409 DUPLICATE_PATIENT_DOCUMENT cuando el documento ya existe en el consultorio')` | **PASSED** |
| **Scenario:** Detección de posible duplicado por número de documento o teléfono | `detect-duplicate-patients.query.spec.ts` -> `it('debe retornar coincidencias por documento o teléfono normalizado dentro del mismo clinicId indicando el motivo')` | `it('debe detectar posibles duplicados por documento o teléfono en GET /v1/patients/check-duplicates (200)')` | **PASSED** |
| **Scenario:** Actualización exitosa de datos de contacto y emergencia de un paciente | `update-patient.use-case.spec.ts` -> `it('debe actualizar los datos demográficos, contacto de emergencia y fuente de captación del paciente')` | `it('debe permitir a ADMIN y AUXILIARY listar, consultar y actualizar datos de un paciente (200)')` | **PASSED** |
| **Scenario:** Administradora desactiva lógicamente a un paciente | `change-patient-status.use-case.spec.ts` -> `it('debe desactivar lógicamente al paciente cambiando isActive a false sin eliminarlo')` | `it('debe permitir a ADMIN desactivar lógicamente a un paciente en PATCH /v1/patients/:id/status (200)')` | **PASSED** |
| **Scenario:** Bloqueo a rol AUXILIARY al intentar desactivar un paciente | `roles.guard.spec.ts` (cubierto en unitarias) | `it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta cambiar el estado en PATCH /v1/patients/:id/status')` | **PASSED** |

---

## 2. Salidas Literales de Consola de Verificación

### 2.1 Lint (`pnpm --filter backend lint`)
```bash
$ eslint "{src,test}/**/*.ts" --max-warnings 0
```
*(Salida con código 0, cero errores y cero advertencias).*

### 2.2 Typecheck (`pnpm --filter backend typecheck`)
```bash
$ tsc --noEmit
```
*(Salida con código 0, cero errores de tipos).*

### 2.3 Dependency Cruiser (`pnpm --filter backend deps:check`)
```bash
$ depcruise --config .dependency-cruiser.js src

✔ no dependency violations found (165 modules, 677 dependencies cruised)
```

### 2.4 Test Coverage (`pnpm --filter backend test:cov`)
```text
----------------------------------------------|---------|----------|---------|---------|----------------------------------------
File                                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
----------------------------------------------|---------|----------|---------|---------|----------------------------------------
All files                                     |   97.47 |    87.56 |   98.24 |   97.39 |                                        
 health                                       |     100 |      100 |     100 |     100 |                                        
  health.controller.ts                        |     100 |      100 |     100 |     100 |                                        
 modules/identity/application/queries         |     100 |      100 |     100 |     100 |                                        
  get-authenticated-user.query.ts             |     100 |      100 |     100 |     100 |                                        
  get-clinic-profile.query.ts                 |     100 |      100 |     100 |     100 |                                        
  list-clinic-users.query.ts                  |     100 |      100 |     100 |     100 |                                        
 modules/identity/application/use-cases       |     100 |    95.23 |     100 |     100 |                                        
  change-user-status.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  create-user.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
  login.use-case.ts                           |     100 |      100 |     100 |     100 |                                        
  logout.use-case.ts                          |     100 |      100 |     100 |     100 |                                        
  refresh-session.use-case.ts                 |     100 |    83.33 |     100 |     100 | 58                                     
  update-clinic-profile.use-case.ts           |     100 |      100 |     100 |     100 |                                        
  update-user.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
 modules/identity/domain                      |   96.39 |    88.88 |     100 |   96.11 |                                        
  clinic.entity.ts                            |   92.85 |       80 |     100 |   92.85 | 60,66                                  
  email.vo.ts                                 |     100 |      100 |     100 |     100 |                                        
  identity.errors.ts                          |     100 |      100 |     100 |     100 |                                        
  refresh-session.entity.ts                   |     100 |      100 |     100 |     100 |                                        
  role.enum.ts                                |     100 |      100 |     100 |     100 |                                        
  user.entity.ts                              |     100 |      100 |     100 |     100 |                                        
 modules/identity/infrastructure/adapters     |     100 |      100 |     100 |     100 |                                        
  argon2-password-hasher.adapter.ts           |     100 |      100 |     100 |     100 |                                        
  jwt-token-service.adapter.ts                |     100 |      100 |     100 |     100 |                                        
 modules/identity/infrastructure/mappers      |     100 |      100 |     100 |     100 |                                        
  clinic.mapper.ts                            |     100 |      100 |     100 |     100 |                                        
  refresh-session.mapper.ts                   |     100 |      100 |     100 |     100 |                                        
  user.mapper.ts                              |     100 |      100 |     100 |     100 |                                        
 modules/identity/infrastructure/repositories |   95.74 |    83.33 |     100 |   95.34 |                                        
  in-memory-clinic.repository.ts              |     100 |      100 |     100 |     100 |                                        
  in-memory-refresh-session.repository.ts     |     100 |      100 |     100 |     100 |                                        
  in-memory-user.repository.ts                |     100 |      100 |     100 |     100 |                                        
  prisma-clinic.repository.ts                 |     100 |      100 |     100 |     100 |                                        
  prisma-refresh-session.repository.ts        |   86.66 |       50 |     100 |   86.66 | 32,36                                  
  prisma-user.repository.ts                   |   94.11 |       80 |     100 |   93.33 | 31                                     
 modules/identity/presentation                |     100 |      100 |     100 |     100 |                                        
  clinic.controller.ts                        |     100 |      100 |     100 |     100 |                                        
  users.controller.ts                         |     100 |      100 |     100 |     100 |                                        
 modules/identity/presentation/dto            |     100 |      100 |     100 |     100 |                                        
  change-user-status.dto.ts                   |     100 |      100 |     100 |     100 |                                        
  clinic-profile.dto.ts                       |     100 |      100 |     100 |     100 |                                        
  create-user.dto.ts                          |     100 |      100 |     100 |     100 |                                        
  login.dto.ts                                |     100 |      100 |     100 |     100 |                                        
  update-clinic.dto.ts                        |     100 |      100 |     100 |     100 |                                        
  update-user.dto.ts                          |     100 |      100 |     100 |     100 |                                        
 modules/patients/application/queries         |   95.45 |    80.64 |     100 |   94.59 |                                        
  detect-duplicate-patients.query.ts          |    91.3 |       75 |     100 |   90.47 |                                        
  get-patient-by-id.query.ts                  |     100 |      100 |     100 |     100 |                                        
  list-patients.query.ts                      |     100 |    83.33 |     100 |     100 |                                        
 modules/patients/application/use-cases       |   95.77 |    66.66 |     100 |   95.38 |                                        
  change-patient-status.use-case.ts           |     100 |      100 |     100 |     100 |                                        
  create-patient.use-case.ts                  |     100 |    66.66 |     100 |     100 |                                        
  update-patient.use-case.ts                  |      88 |    53.84 |     100 |   86.95 |                                        
 modules/patients/domain                      |   96.63 |    86.66 |     100 |   96.63 |                                        
  acquisition-source.enum.ts                  |     100 |      100 |     100 |     100 |                                        
  document-identity.vo.ts                     |    90.9 |    83.33 |     100 |    90.9 |                                        
  document-type.enum.ts                       |     100 |      100 |     100 |     100 |                                        
  emergency-contact.vo.ts                     |   85.71 |    66.66 |     100 |   85.71 |                                        
  patient.entity.ts                           |   96.61 |    84.61 |     100 |   96.61 |                                        
  patients.errors.ts                          |     100 |      100 |     100 |     100 |                                        
  phone-number.vo.ts                          |     100 |      100 |     100 |     100 |                                        
 modules/patients/infrastructure/mappers      |     100 |    71.42 |     100 |     100 |                                        
  patient.mapper.ts                           |     100 |    71.42 |     100 |     100 |                                        
 modules/patients/infrastructure/repositories |   92.98 |    84.84 |     100 |   92.45 |                                        
  in-memory-patient.repository.ts             |   93.54 |    86.36 |     100 |   93.54 |                                        
  prisma-patient.repository.ts                |    92.3 |    81.81 |     100 |    90.9 |                                        
 modules/patients/presentation                |     100 |       50 |     100 |     100 |                                        
  patients.controller.ts                      |     100 |       50 |     100 |     100 |                                        
 modules/patients/presentation/dto            |     100 |      100 |     100 |     100 |                                        
  change-patient-status.dto.ts                |     100 |      100 |     100 |     100 |                                        
  check-duplicates-query.dto.ts               |     100 |      100 |     100 |     100 |                                        
  create-patient.dto.ts                       |     100 |      100 |     100 |     100 |                                        
  patient-response.dto.ts                     |     100 |      100 |     100 |     100 |                                        
  update-patient.dto.ts                       |     100 |      100 |     100 |     100 |                                        
 shared/domain                                |     100 |      100 |     100 |     100 |                                        
  aggregate-root.ts                           |     100 |      100 |     100 |     100 |                                        
  domain-error.ts                             |     100 |      100 |     100 |     100 |                                        
 shared/infrastructure/adapters               |     100 |      100 |     100 |     100 |                                        
  nest-event-bus.adapter.ts                   |     100 |      100 |     100 |     100 |                                        
  prisma-unit-of-work.adapter.ts              |     100 |      100 |     100 |     100 |                                        
  system-clock.adapter.ts                     |     100 |      100 |     100 |     100 |                                        
  uuid-generator.adapter.ts                   |     100 |      100 |     100 |     100 |                                        
 shared/infrastructure/logger                 |     100 |      100 |     100 |     100 |                                        
  logger.config.ts                            |     100 |      100 |     100 |     100 |                                        
 shared/infrastructure/middleware             |     100 |      100 |     100 |     100 |                                        
  correlation-id.middleware.ts                |     100 |      100 |     100 |     100 |                                        
 shared/infrastructure/prisma                 |     100 |      100 |     100 |     100 |                                        
  prisma.service.ts                           |     100 |      100 |     100 |     100 |                                        
 shared/infrastructure/sentry                 |     100 |      100 |     100 |     100 |                                        
  sentry.sanitizer.ts                         |     100 |      100 |     100 |     100 |                                        
 shared/presentation/decorators               |   77.77 |      100 |      50 |   71.42 |                                        
  current-clinic.decorator.ts                 |      50 |      100 |       0 |      50 |                                        
  current-user.decorator.ts                   |      50 |      100 |       0 |      50 |                                        
  public.decorator.ts                         |     100 |      100 |     100 |     100 |                                        
  roles.decorator.ts                          |     100 |      100 |     100 |     100 |                                        
 shared/presentation/filters                  |     100 |      100 |     100 |     100 |                                        
  domain-exception.filter.ts                  |     100 |      100 |     100 |     100 |                                        
 shared/presentation/guards                   |     100 |      100 |     100 |     100 |                                        
  jwt-auth.guard.ts                           |     100 |      100 |     100 |     100 |                                        
  roles.guard.ts                              |     100 |      100 |     100 |     100 |                                        
----------------------------------------------|---------|----------|---------|---------|----------------------------------------

Test Suites: 44 passed, 44 total
Tests:       182 passed, 182 total
Snapshots:   0 total
Time:        51.24 s
Ran all test suites.
```

### 2.5 Test E2E (`pnpm --filter backend test:e2e`)
```text
PASS test/health.e2e-spec.ts (17.585 s)
PASS test/users-and-clinic.e2e-spec.ts (20.574 s)
PASS test/patients.e2e-spec.ts (17.307 s)
PASS test/auth.e2e-spec.ts (21.406 s)

Test Suites: 4 passed, 4 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        24.153 s
Ran all test suites.
```
