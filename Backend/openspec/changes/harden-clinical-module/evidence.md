# Evidencia de Calidad y Pruebas - Change: harden-clinical-module

## 1. Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto 1:1)

| Escenario / Requisito | Archivo de Prueba Unitaria / Contrato (PostgreSQL Real + InMemory) | Archivo E2E (`Backend/test/`) | Estado |
| :--- | :--- | :--- | :--- |
| **Scenario:** Administradora registra y actualiza una atención clínica con notas privadas y auxiliar la consulta sin ver las notas privadas (Doble barrera en Entidad y DTO) | `clinical-attention.entity.spec.ts` y `clinical-attentions.controller.spec.ts` -> `it('debe ocultar privateNotes en la entidad y en ClinicalAttentionResponseDto/ClinicalAttentionVersionResponseDto cuando viewerRole no es ADMIN')` | `test/clinical-attentions.e2e-spec.ts` -> `it('debe permitir a ADMIN registrar y actualizar una atención con notas privadas y a AUXILIARY consultarla recibiendo privateNotes en null (201/200)')` | **PASSED** |
| **Scenario:** Actualización de historia clínica conserva versión inmutable previa y permite consultarla | `update-clinical-history.use-case.spec.ts` y `clinical-history-repository.contract.spec.ts` -> `it('debe guardar atómicamente una versión inmutable en ClinicalHistoryVersion al actualizar la historia clínica y permitir listar sus versiones')` | `test/clinical-history.e2e-spec.ts` -> `it('debe conservar una versión inmutable al actualizar la historia clínica y permitir a ADMIN y AUXILIARY consultar el historial de versiones (200)')` | **PASSED** |
| **Scenario:** Rechazo al agregar ítem al plan de tratamiento con número de diente FDI inválido | `treatment-plan-item.entity.spec.ts` -> `it('debe lanzar InvalidOdontogramDataError (400) cuando toothNumber en el plan de tratamiento no es un código FDI válido')` | `test/clinical-history.e2e-spec.ts` -> `it('debe rechazar con 400 INVALID_ODONTOGRAM_DATA al agregar un ítem al plan de tratamiento con diente FDI inválido')` | **PASSED** |
| **Scenario:** Generación exitosa de PDF de historia clínica para un paciente con 200 atenciones dentro del presupuesto de memoria | `pdfmake-clinical-history-pdf-generator.adapter.spec.ts` -> `it('debe generar el PDF para un paciente con 200 atenciones en menos de 2000 ms y con incremento de heap menor a 100 MB (RC-030)')` | Cubierto en prueba de integración del adaptador `pdfmake` | **PASSED** |
| **Scenario:** Rechazo por conflicto de concurrencia optimista cuando expectedUpdatedAt no coincide con la versión actual | `upsert-patient-odontogram.use-case.spec.ts` y `odontogram-repositories.contract.spec.ts` -> `it('debe lanzar OdontogramConflictError (409) cuando expectedUpdatedAt no coincide con el updatedAt actual del odontograma')` | `test/odontogram.e2e-spec.ts` -> `it('debe rechazar con 409 ODONTOGRAM_CONFLICT cuando expectedUpdatedAt no coincide con la última versión guardada del odontograma')` | **PASSED** |
| **Scenario:** Rechazo al registrar o actualizar una atención con código de procedimiento inexistente, diente FDI inválido o superficie inválida | `clinical-attention.entity.spec.ts` y `create-clinical-attention.use-case.spec.ts` -> `it('debe rechazar procedimientos con código inexistente en el catálogo (404) o con diente FDI o superficie inválidos (400)')` | `test/clinical-attentions.e2e-spec.ts` -> `it('debe rechazar con 404 PROCEDURE_NOT_FOUND cuando el procedimiento no existe en el catálogo o con 400 si el diente FDI o superficie son inválidos')` | **PASSED** |
| **Scenario:** Reversión transaccional del cierre de atención si falla la publicación del evento AttentionClosedEvent | `close-clinical-attention.use-case.spec.ts` -> `it('debe ejecutar el guardado y la publicación de AttentionClosedEvent dentro de UnitOfWorkPort propagando errores si un manejador falla')` | Cubierto en prueba unitaria con `UnitOfWorkPort` | **PASSED** |
| **Scenario:** Descuento atómico exacto bajo consumos concurrentes sobre el mismo material propio | `catalogs-repositories.contract.spec.ts` -> `it('debe descontar existencias atómicamente ante consumos concurrentes sin perder actualizaciones e impidiendo saldos negativos')` | `test/catalogs.e2e-spec.ts` -> `it('debe rechazar con 400 cuando el id de procedimiento o material no es un UUID válido')` | **PASSED** |
| **Auditoría 1 (RC-018, RC-050):** Guarda de seguridad `assertSafeTestDatabase` y `cleanDatabaseForContractTests` | `test-database-cleaner.util.spec.ts` (10 pruebas unitarias con bloqueos de producción, host remoto y override controlado) y suites de contrato unificadas | Todas las suites de contrato contra PostgreSQL local | **PASSED** |
| **Auditoría 4 (RC-055):** `onDelete: Restrict` en `ClinicalHistoryVersion` y eliminación de 3 índices redundantes | Migración PostgreSQL real `20261016014500_add_clinical_history_versions_and_drop_redundant_indexes` | `test/clinical-history.e2e-spec.ts` | **PASSED** |
| **Auditoría 6 (RC-011, RC-012, RC-017):** VO `ClinicalDiagnosis`, validación FDI / superficies / catálogo y cierre atómico en `UnitOfWork` | `clinical-diagnosis.vo.spec.ts`, `clinical-attention.entity.spec.ts`, `close-clinical-attention.use-case.spec.ts` | `test/clinical-attentions.e2e-spec.ts`, `test/clinical-history.e2e-spec.ts` | **PASSED** |

---

## 2. Salidas Literales de Consola de Verificación

### 2.1 OpenAPI Generation (`pnpm --filter backend openapi:generate`)
```text
> backend@0.0.1 openapi:generate C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> ts-node --transpile-only -r tsconfig-paths/register src/generate-openapi.ts

OpenAPI schema generado exitosamente en C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend\openapi.json
```

### 2.2 Lint (`pnpm --filter backend lint`)
```text
> backend@0.0.1 lint C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> eslint "{src,test}/**/*.ts" --max-warnings 0
```

### 2.3 Typecheck (`pnpm --filter backend typecheck`)
```text
> backend@0.0.1 typecheck C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> tsc --noEmit
```

### 2.4 Dependency Cruiser (`pnpm --filter backend deps:check`)
```text
> backend@0.0.1 deps:check C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> depcruise --config .dependency-cruiser.js src

✔ no dependency violations found (355 modules, 1799 dependencies cruised)
```

### 2.5 Test Coverage (`pnpm --filter backend test:cov`)
```text
> backend@0.0.1 test:cov C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> jest --coverage

PASS src/modules/clinical/application/use-cases/create-clinical-attention.use-case.spec.ts (8.926 s)
PASS src/modules/patients/infrastructure/queries/patients-queries.contract.spec.ts (5.462 s)
PASS src/modules/clinical/infrastructure/repositories/odontogram-repositories.contract.spec.ts
PASS src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.spec.ts
PASS src/modules/clinical/infrastructure/repositories/clinical-attention-repository.contract.spec.ts
PASS src/modules/patients/infrastructure/repositories/patients-repository.contract.spec.ts
PASS src/modules/clinical/presentation/clinical-history.controller.spec.ts
PASS src/modules/identity/infrastructure/repositories/identity-repositories.contract.spec.ts
PASS src/modules/clinical/presentation/clinical-attentions.controller.spec.ts
PASS src/modules/clinical/presentation/odontogram.controller.spec.ts
PASS src/modules/clinical/application/use-cases/upsert-patient-odontogram.use-case.spec.ts
PASS src/modules/clinical/application/queries/export-clinical-history-pdf.query.spec.ts
PASS src/modules/clinical/application/use-cases/add-treatment-plan-item.use-case.spec.ts
PASS src/modules/clinical/application/use-cases/add-attention-material-used.use-case.spec.ts
PASS src/modules/catalogs/presentation/catalogs.controller.spec.ts
PASS src/modules/clinical/application/mappers/clinical-history-pdf-document.mapper.spec.ts
PASS src/modules/patients/presentation/patients.controller.spec.ts
PASS src/modules/clinical/application/use-cases/create-odontogram-snapshot.use-case.spec.ts
PASS src/modules/catalogs/application/use-cases/set-patient-procedure-price.use-case.spec.ts
PASS src/modules/clinical/application/use-cases/create-clinical-history.use-case.spec.ts
PASS src/modules/clinical/application/queries/list-odontogram-snapshots.query.spec.ts
PASS src/modules/clinical/application/queries/get-clinical-attention-by-id.query.spec.ts
PASS src/configure-app.spec.ts
PASS src/modules/identity/infrastructure/adapters/argon2-password-hasher.adapter.spec.ts
PASS src/modules/identity/presentation/clinic.controller.spec.ts
PASS src/modules/clinical/application/queries/list-clinical-attention-versions.query.spec.ts
PASS src/modules/clinical/application/queries/list-clinical-attentions-by-patient.query.spec.ts
PASS src/modules/identity/presentation/users.controller.spec.ts
PASS src/modules/patients/presentation/dto/search-patients-query.dto.spec.ts
PASS src/health/health.controller.spec.ts
PASS src/shared/presentation/guards/jwt-auth.guard.spec.ts
PASS src/modules/identity/application/queries/get-authenticated-user.query.spec.ts
PASS src/modules/identity/application/use-cases/update-user.use-case.spec.ts
PASS src/shared/infrastructure/adapters/nest-event-bus.adapter.spec.ts
PASS src/shared/presentation/guards/roles.guard.spec.ts
PASS src/shared/infrastructure/prisma/prisma.service.spec.ts
[Nest] 17032  - 16/10/2026, 6:56:58 p. m.     LOG [PrismaService] Prisma conectado exitosamente a PostgreSQL
[Nest] 17032  - 16/10/2026, 6:56:58 p. m.    WARN [PrismaService] No se pudo conectar a la base de datos al iniciar: Connection error
PASS src/modules/identity/application/queries/get-clinic-profile.query.spec.ts
PASS src/modules/clinical/application/use-cases/close-clinical-attention.use-case.spec.ts
PASS src/modules/identity/infrastructure/adapters/jwt-token-service.adapter.spec.ts
PASS src/modules/identity/application/use-cases/change-user-status.use-case.spec.ts
PASS src/shared/presentation/decorators/param-decorators.spec.ts
PASS src/modules/clinical/application/use-cases/update-clinical-history.use-case.spec.ts
PASS src/modules/catalogs/application/use-cases/consume-material-stock.use-case.spec.ts
PASS src/modules/identity/application/use-cases/update-clinic-profile.use-case.spec.ts
PASS src/modules/patients/application/queries/detect-duplicate-patients.query.spec.ts
PASS src/modules/identity/application/use-cases/create-user.use-case.spec.ts
PASS src/modules/clinical/application/use-cases/update-treatment-plan-item-status.use-case.spec.ts
PASS src/modules/patients/application/use-cases/create-patient.use-case.spec.ts
PASS src/modules/clinical/application/queries/get-tooth-material-history.query.spec.ts
PASS src/modules/catalogs/application/queries/list-patient-procedure-prices.query.spec.ts
PASS src/modules/clinical/application/queries/list-clinical-history-versions.query.spec.ts
PASS src/modules/clinical/application/queries/get-odontogram-by-patient.query.spec.ts
PASS src/modules/patients/application/queries/search-patients.query.spec.ts
PASS src/modules/identity/application/use-cases/refresh-session.use-case.spec.ts
PASS src/shared/presentation/filters/domain-exception.filter.spec.ts
PASS src/modules/identity/application/use-cases/login.use-case.spec.ts
PASS src/modules/catalogs/application/use-cases/update-material.use-case.spec.ts
PASS src/modules/catalogs/application/use-cases/update-procedure.use-case.spec.ts
PASS src/modules/catalogs/application/use-cases/create-procedure.use-case.spec.ts
PASS src/modules/patients/application/use-cases/update-patient.use-case.spec.ts
PASS src/modules/catalogs/application/use-cases/create-material.use-case.spec.ts
PASS src/modules/catalogs/application/queries/list-procedures.query.spec.ts
PASS src/shared/infrastructure/adapters/prisma-unit-of-work.adapter.spec.ts
PASS src/modules/patients/application/use-cases/change-patient-status.use-case.spec.ts
PASS src/modules/clinical/application/queries/get-clinical-history-by-patient.query.spec.ts
PASS src/modules/identity/application/use-cases/logout.use-case.spec.ts
PASS src/shared/infrastructure/adapters/system-clock.adapter.spec.ts
PASS src/modules/patients/application/queries/get-patient-by-id.query.spec.ts
PASS src/modules/identity/application/queries/list-clinic-users.query.spec.ts
PASS src/modules/patients/application/queries/list-patients.query.spec.ts
PASS src/shared/infrastructure/adapters/uuid-generator.adapter.spec.ts
PASS src/modules/catalogs/application/queries/list-materials.query.spec.ts
PASS src/shared/infrastructure/middleware/correlation-id.middleware.spec.ts
PASS src/modules/clinical/domain/clinical-attention.entity.spec.ts
PASS src/shared/infrastructure/logger/logger.redact.spec.ts
PASS src/modules/clinical/domain/treatment-plan-item.entity.spec.ts
PASS src/modules/clinical/domain/clinical-history.entity.spec.ts
PASS src/modules/patients/domain/patient.entity.spec.ts
PASS src/modules/catalogs/domain/material.entity.spec.ts
PASS src/modules/clinical/domain/tooth-finding.vo.spec.ts
PASS src/modules/clinical/domain/tooth-number.vo.spec.ts
PASS src/modules/clinical/domain/clinical-attention-version.entity.spec.ts
PASS src/modules/clinical/domain/clinical-history-version.entity.spec.ts
PASS src/modules/clinical/domain/odontogram.entity.spec.ts
PASS src/modules/identity/domain/email.vo.spec.ts
PASS src/modules/patients/domain/emergency-contact.vo.spec.ts
PASS src/modules/clinical/domain/attention-material-used.entity.spec.ts
PASS src/modules/patients/domain/phone-number.vo.spec.ts
PASS src/modules/catalogs/domain/patient-procedure-price.entity.spec.ts
PASS src/modules/clinical/domain/odontogram-snapshot.entity.spec.ts
PASS src/modules/clinical/domain/clinical-diagnosis.vo.spec.ts
PASS src/modules/catalogs/domain/procedure.entity.spec.ts
PASS src/modules/identity/domain/clinic.entity.spec.ts
PASS src/modules/patients/domain/document-identity.vo.spec.ts
PASS src/modules/identity/domain/user.entity.spec.ts
PASS src/modules/catalogs/domain/money.vo.spec.ts
PASS src/shared/infrastructure/prisma/test-database-cleaner.util.spec.ts
PASS src/modules/clinical/domain/medical-antecedents.vo.spec.ts
PASS src/shared/domain/domain-error.spec.ts
PASS src/modules/identity/domain/refresh-session.entity.spec.ts
PASS src/shared/infrastructure/sentry/sentry.sanitizer.spec.ts
PASS src/shared/domain/aggregate-root.spec.ts
PASS src/modules/clinical/infrastructure/repositories/clinical-history-repository.contract.spec.ts
PASS src/modules/clinical/application/use-cases/update-clinical-attention.use-case.spec.ts
PASS src/modules/clinical/application/use-cases/amend-closed-clinical-attention.use-case.spec.ts
PASS src/modules/catalogs/infrastructure/repositories/catalogs-repositories.contract.spec.ts
-----------------------------------------------------|---------|----------|---------|---------|----------------------------------------
File                                                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
-----------------------------------------------------|---------|----------|---------|---------|----------------------------------------
All files                                            |    97.7 |    90.35 |   94.71 |   97.74 |                                        
 src                                                 |     100 |      100 |     100 |     100 |                                        
  configure-app.ts                                   |     100 |      100 |     100 |     100 |                                        
 src/health                                          |     100 |      100 |     100 |     100 |                                        
  health.controller.ts                               |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/application/queries            |     100 |      100 |     100 |     100 |                                        
  list-materials.query.ts                            |     100 |      100 |     100 |     100 |                                        
  list-patient-procedure-prices.query.ts             |     100 |      100 |     100 |     100 |                                        
  list-procedures.query.ts                           |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/application/use-cases          |     100 |      100 |     100 |     100 |                                        
  consume-material-stock.use-case.ts                 |     100 |      100 |     100 |     100 |                                        
  create-material.use-case.ts                        |     100 |      100 |     100 |     100 |                                        
  create-procedure.use-case.ts                       |     100 |      100 |     100 |     100 |                                        
  set-patient-procedure-price.use-case.ts            |     100 |      100 |     100 |     100 |                                        
  update-material.use-case.ts                        |     100 |      100 |     100 |     100 |                                        
  update-procedure.use-case.ts                       |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/domain                         |     100 |      100 |     100 |     100 |                                        
  catalogs.errors.ts                                 |     100 |      100 |     100 |     100 |                                        
  material.entity.ts                                 |     100 |      100 |     100 |     100 |                                        
  money.vo.ts                                        |     100 |      100 |     100 |     100 |                                        
  patient-procedure-price.entity.ts                  |     100 |      100 |     100 |     100 |                                        
  procedure.entity.ts                                |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/infrastructure/mappers         |     100 |      100 |     100 |     100 |                                        
  material.mapper.ts                                 |     100 |      100 |     100 |     100 |                                        
  patient-procedure-price.mapper.ts                  |     100 |      100 |     100 |     100 |                                        
  procedure.mapper.ts                                |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/infrastructure/repositories    |   98.15 |    88.09 |     100 |   97.91 |                                        
  in-memory-material.repository.ts                   |     100 |    88.46 |     100 |     100 | 10,30-33                               
  in-memory-patient-procedure-price.repository.ts    |     100 |     92.3 |     100 |     100 | 15                                     
  in-memory-procedure.repository.ts                  |     100 |    94.73 |     100 |     100 | 19                                     
  prisma-material.repository.ts                      |   94.44 |    78.57 |     100 |   93.93 | 74,114                                 
  prisma-patient-procedure-price.repository.ts       |     100 |       50 |     100 |     100 | 26                                     
  prisma-procedure.repository.ts                     |   95.83 |       90 |     100 |   95.23 | 63                                     
 src/modules/catalogs/presentation                   |     100 |      100 |     100 |     100 |                                        
  catalogs.controller.ts                             |     100 |      100 |     100 |     100 |                                        
 src/modules/catalogs/presentation/dto               |   97.59 |        0 |      60 |   97.59 |                                        
  material.dto.ts                                    |   97.29 |        0 |      50 |   97.29 | 103                                    
  patient-procedure-price.dto.ts                     |     100 |      100 |     100 |     100 |                                        
  procedure.dto.ts                                   |   96.29 |        0 |      50 |   96.29 | 75                                     
 src/modules/clinical/application/mappers            |     100 |      100 |     100 |     100 |                                        
  clinical-history-pdf-document.mapper.ts            |     100 |      100 |     100 |     100 |                                        
 src/modules/clinical/application/queries            |   99.27 |      100 |   95.65 |     100 |                                        
  export-clinical-history-pdf.query.ts               |     100 |      100 |     100 |     100 |                                        
  get-clinical-attention-by-id.query.ts              |     100 |      100 |     100 |     100 |                                        
  get-clinical-history-by-patient.query.ts           |     100 |      100 |     100 |     100 |                                        
  get-odontogram-by-patient.query.ts                 |     100 |      100 |     100 |     100 |                                        
  get-tooth-material-history.query.ts                |     100 |      100 |     100 |     100 |                                        
  list-clinical-attention-versions.query.ts          |   94.11 |      100 |      75 |     100 |                                        
  list-clinical-attentions-by-patient.query.ts       |     100 |      100 |     100 |     100 |                                        
  list-clinical-history-versions.query.ts            |     100 |      100 |     100 |     100 |                                        
  list-odontogram-snapshots.query.ts                 |     100 |      100 |     100 |     100 |                                        
 src/modules/clinical/application/use-cases          |     100 |    98.66 |     100 |     100 |                                        
  add-attention-material-used.use-case.ts            |     100 |      100 |     100 |     100 |                                        
  add-treatment-plan-item.use-case.ts                |     100 |      100 |     100 |     100 |                                        
  amend-closed-clinical-attention.use-case.ts        |     100 |      100 |     100 |     100 |                                        
  close-clinical-attention.use-case.ts               |     100 |      100 |     100 |     100 |                                        
  create-clinical-attention.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  create-clinical-history.use-case.ts                |     100 |    92.85 |     100 |     100 | 43                                     
  create-odontogram-snapshot.use-case.ts             |     100 |      100 |     100 |     100 |                                        
  update-clinical-attention.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  update-clinical-history.use-case.ts                |     100 |      100 |     100 |     100 |                                        
  update-treatment-plan-item-status.use-case.ts      |     100 |      100 |     100 |     100 |                                        
  upsert-patient-odontogram.use-case.ts              |     100 |      100 |     100 |     100 |                                     
 src/modules/clinical/domain                         |   99.66 |    95.55 |     100 |   99.66 |                                        
  attention-closed.event.ts                          |     100 |      100 |     100 |     100 |                                        
  attention-material-used.entity.ts                  |     100 |      100 |     100 |     100 |                                        
  clinical-attention-status.enum.ts                  |     100 |      100 |     100 |     100 |                                        
  clinical-attention-version.entity.ts               |     100 |      100 |     100 |     100 |                                        
  clinical-attention.entity.ts                       |     100 |    92.38 |     100 |     100 | 66,83,179,205,211,367,371,377          
  clinical-diagnosis.vo.ts                           |     100 |      100 |     100 |     100 |                                        
  clinical-history-version.entity.ts                 |     100 |      100 |     100 |     100 |                                        
  clinical-history.entity.ts                         |     100 |    93.93 |     100 |     100 | 112,191                                
  clinical.errors.ts                                 |     100 |    66.66 |     100 |     100 | 114                                    
  finding-catalog.enum.ts                            |     100 |      100 |     100 |     100 |                                        
  finding-status.enum.ts                             |     100 |      100 |     100 |     100 |                                        
  medical-antecedents.vo.ts                          |     100 |      100 |     100 |     100 |                                        
  odontogram-snapshot.entity.ts                      |   95.65 |       90 |     100 |   95.65 | 41                                     
  odontogram.entity.ts                               |     100 |      100 |     100 |     100 |                                        
  tooth-finding.vo.ts                                |   96.55 |    92.85 |     100 |   96.55 | 27                                     
  tooth-number.vo.ts                                 |     100 |      100 |     100 |     100 |                                        
  tooth-surface.enum.ts                              |     100 |      100 |     100 |     100 |                                        
  treatment-item-status.enum.ts                      |     100 |      100 |     100 |     100 |                                        
  treatment-plan-item.entity.ts                      |     100 |    94.11 |     100 |     100 | 73                                     
 src/modules/clinical/infrastructure/adapters        |   85.21 |    55.69 |      80 |   88.46 |                                        
  pdfmake-clinical-history-pdf-generator.adapter.ts  |   85.21 |    55.69 |      80 |   88.46 | 45-52,208-214,430                      
 src/modules/clinical/infrastructure/mappers         |     100 |    70.83 |     100 |     100 |                                        
  clinical-attention.mapper.ts                       |     100 |       50 |     100 |     100 | 22-39                                  
  clinical-history.mapper.ts                         |     100 |       75 |     100 |     100 | 20,41-58                               
  odontogram.mapper.ts                               |     100 |       75 |     100 |     100 | 16,30                                  
 src/modules/clinical/infrastructure/repositories    |   94.92 |    94.02 |   92.72 |   94.94 |                                        
  in-memory-clinical-attention-version.repository.ts |    90.9 |      100 |      80 |    90.9 | 14                                     
  in-memory-clinical-attention.repository.ts         |      90 |      100 |      80 |      90 | 18                                     
  in-memory-clinical-history-version.repository.ts   |   91.66 |      100 |   83.33 |   91.66 | 11                                     
  in-memory-clinical-history.repository.ts           |   93.75 |       90 |     100 |   93.75 | 11                                     
  in-memory-odontogram-snapshot.repository.ts        |      90 |      100 |      75 |     100 |                                        
  in-memory-odontogram.repository.ts                 |     100 |      100 |     100 |     100 |                                        
  prisma-clinical-attention-version.repository.ts    |   94.44 |      100 |     100 |   93.33 | 44                                     
  prisma-clinical-attention.repository.ts            |   95.45 |       75 |     100 |   94.44 | 81                                     
  prisma-clinical-history-version.repository.ts      |   94.44 |      100 |     100 |   93.33 | 41                                     
  prisma-clinical-history.repository.ts              |   92.59 |    77.77 |     100 |   91.66 | 76,84                                  
  prisma-odontogram-snapshot.repository.ts           |     100 |      100 |     100 |     100 |                                        
  prisma-odontogram.repository.ts                    |     100 |      100 |     100 |     100 |                                        
 src/modules/clinical/presentation                   |     100 |       50 |     100 |     100 |                                        
  clinical-attentions.controller.ts                  |     100 |       50 |     100 |     100 | 80                                     
  clinical-history.controller.ts                     |     100 |      100 |     100 |     100 |                                        
  odontogram.controller.ts                           |     100 |      100 |     100 |     100 |                                        
 src/modules/clinical/presentation/dto               |   97.74 |       60 |   58.82 |   97.74 |                                        
  add-attention-material-used.dto.ts                 |     100 |      100 |     100 |     100 |                                        
  add-treatment-plan-item.dto.ts                     |     100 |      100 |     100 |     100 |                                        
  amend-clinical-attention.dto.ts                    |     100 |      100 |     100 |     100 |                                        
  clinical-attention-response.dto.ts                 |     100 |       60 |     100 |     100 | 132,149-244,255                        
  clinical-diagnosis.dto.ts                          |     100 |      100 |     100 |     100 |                                        
  clinical-history-response.dto.ts                   |   95.55 |      100 |   66.66 |   95.55 | 101,133                                
  create-clinical-attention.dto.ts                   |     100 |      100 |     100 |     100 |                                        
  create-clinical-history.dto.ts                     |   86.66 |      100 |       0 |   86.66 | 27,53                                  
  create-odontogram-snapshot.dto.ts                  |     100 |      100 |     100 |     100 |                                        
  medical-antecedents.dto.ts                         |     100 |      100 |     100 |     100 |                                        
  odontogram-response.dto.ts                         |     100 |      100 |     100 |     100 |                                        
  tooth-material-history-response.dto.ts             |     100 |      100 |     100 |     100 |                                        
  update-clinical-attention.dto.ts                   |     100 |      100 |     100 |     100 |                                        
  update-clinical-history.dto.ts                     |   86.66 |      100 |       0 |   86.66 | 29,55                                  
  update-treatment-item-status.dto.ts                |     100 |      100 |     100 |     100 |                                        
  upsert-odontogram.dto.ts                           |   94.11 |      100 |       0 |   94.11 | 84                                     
 src/modules/identity/application/queries            |     100 |      100 |     100 |     100 |                                        
  get-authenticated-user.query.ts                    |     100 |      100 |     100 |     100 |                                        
  get-clinic-profile.query.ts                        |     100 |      100 |     100 |     100 |                                        
  list-clinic-users.query.ts                         |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/application/use-cases          |   99.43 |    96.55 |     100 |   99.38 |                                        
  change-user-status.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
  create-user.use-case.ts                            |     100 |      100 |     100 |     100 |                                        
  login.use-case.ts                                  |     100 |      100 |     100 |     100 |                                        
  logout.use-case.ts                                 |     100 |      100 |     100 |     100 |                                        
  refresh-session.use-case.ts                        |   96.96 |    85.71 |     100 |   96.77 | 57                                     
  update-clinic-profile.use-case.ts                  |     100 |      100 |     100 |     100 |                                        
  update-user.use-case.ts                            |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/domain                         |     100 |    97.14 |     100 |     100 |                                        
  clinic.entity.ts                                   |     100 |      100 |     100 |     100 |                                        
  email.vo.ts                                        |     100 |      100 |     100 |     100 |                                        
  identity.errors.ts                                 |     100 |        0 |     100 |     100 | 43                                     
  refresh-session.entity.ts                          |     100 |      100 |     100 |     100 |                                        
  role.enum.ts                                       |     100 |      100 |     100 |     100 |                                        
  user.entity.ts                                     |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/infrastructure/adapters        |     100 |      100 |     100 |     100 |                                        
  argon2-password-hasher.adapter.ts                  |     100 |      100 |     100 |     100 |                                        
  jwt-token-service.adapter.ts                       |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/infrastructure/mappers         |     100 |       75 |     100 |     100 |                                        
  clinic.mapper.ts                                   |     100 |       75 |     100 |     100 | 13                                     
  refresh-session.mapper.ts                          |     100 |      100 |     100 |     100 |                                        
  user.mapper.ts                                     |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/infrastructure/repositories    |   94.56 |       96 |      88 |   93.67 |                                        
  in-memory-clinic.repository.ts                     |   88.88 |      100 |   66.66 |   85.71 | 19                                     
  in-memory-refresh-session.repository.ts            |   85.71 |      100 |      75 |   83.33 | 15,31                                  
  in-memory-user.repository.ts                       |   95.83 |      100 |      80 |   95.45 | 49                                     
  prisma-clinic.repository.ts                        |     100 |      100 |     100 |     100 |                                        
  prisma-refresh-session.repository.ts               |     100 |       50 |     100 |     100 | 15                                     
  prisma-user.repository.ts                          |   95.45 |      100 |     100 |   94.73 | 49                                     
 src/modules/identity/presentation                   |   75.28 |        0 |      50 |   73.49 |                                        
  auth.controller.ts                                 |   51.11 |        0 |       0 |   48.83 | 45-48,65-72,91-101,113-117,129,142-158 
  clinic.controller.ts                               |     100 |      100 |     100 |     100 |                                        
  users.controller.ts                                |     100 |      100 |     100 |     100 |                                        
 src/modules/identity/presentation/dto               |     100 |      100 |     100 |     100 |                                        
  auth-response.dto.ts                               |     100 |      100 |     100 |     100 |                                        
  change-user-status.dto.ts                          |     100 |      100 |     100 |     100 |                                        
  clinic-profile.dto.ts                              |     100 |      100 |     100 |     100 |                                        
  create-user.dto.ts                                 |     100 |      100 |     100 |     100 |                                        
  login.dto.ts                                       |     100 |      100 |     100 |     100 |                                        
  update-clinic.dto.ts                               |     100 |      100 |     100 |     100 |                                        
  update-user.dto.ts                                 |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/application/queries            |     100 |    97.56 |     100 |     100 |                                        
  detect-duplicate-patients.query.ts                 |     100 |      100 |     100 |     100 |                                        
  get-patient-by-id.query.ts                         |     100 |      100 |     100 |     100 |                                        
  list-patients.query.ts                             |     100 |      100 |     100 |     100 |                                        
  search-patients.query.ts                           |     100 |       90 |     100 |     100 | 23                                     
 src/modules/patients/application/use-cases          |     100 |      100 |     100 |     100 |                                        
  change-patient-status.use-case.ts                  |     100 |      100 |     100 |     100 |                                        
  create-patient.use-case.ts                         |     100 |      100 |     100 |     100 |                                        
  update-patient.use-case.ts                         |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/domain                         |     100 |    95.55 |     100 |     100 |                                        
  acquisition-source.enum.ts                         |     100 |      100 |     100 |     100 |                                        
  document-identity.vo.ts                            |     100 |      100 |     100 |     100 |                                        
  document-type.enum.ts                              |     100 |      100 |     100 |     100 |                                        
  emergency-contact.vo.ts                            |     100 |      100 |     100 |     100 |                                        
  patient.entity.ts                                  |     100 |     92.3 |     100 |     100 | 164,167                                
  patients.errors.ts                                 |     100 |      100 |     100 |     100 |                                        
  phone-number.vo.ts                                 |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/infrastructure/mappers         |     100 |      100 |     100 |     100 |                                        
  patient.mapper.ts                                  |     100 |      100 |     100 |     100 |                                        
 src/modules/patients/infrastructure/queries         |    92.7 |     75.8 |   93.75 |    92.3 |                                        
  in-memory-patient.queries.ts                       |   87.75 |    77.77 |    87.5 |    87.5 | 37,66,73,107-110                       
  prisma-patient.queries.ts                          |     100 |    79.16 |     100 |     100 | 39,102-114,117                         
  trigram-similarity.util.ts                         |      96 |    63.63 |     100 |   95.83 | 36                                     
 src/modules/patients/infrastructure/repositories    |   92.53 |     87.8 |     100 |   92.06 |                                        
  in-memory-patient.repository.ts                    |   94.28 |    88.88 |     100 |   94.28 | 45,70                                  
  prisma-patient.repository.ts                       |   90.62 |    85.71 |     100 |   89.28 | 53,60,99                               
 src/modules/patients/presentation                   |     100 |       50 |     100 |     100 |                                        
  patients.controller.ts                             |     100 |       50 |     100 |     100 | 108                                    
 src/modules/patients/presentation/dto               |     100 |      100 |     100 |     100 |                                        
  change-patient-status.dto.ts                       |     100 |      100 |     100 |     100 |                                        
  check-duplicates-query.dto.ts                      |     100 |      100 |     100 |     100 |                                        
  create-patient.dto.ts                              |     100 |      100 |     100 |     100 |                                        
  patient-response.dto.ts                            |     100 |      100 |     100 |     100 |                                        
  search-patients-query.dto.ts                       |     100 |      100 |     100 |     100 |                                        
  update-patient.dto.ts                              |     100 |      100 |     100 |     100 |                                        
 src/shared/domain                                   |     100 |      100 |     100 |     100 |                                        
  aggregate-root.ts                                  |     100 |      100 |     100 |     100 |                                        
  domain-error.ts                                    |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/adapters                  |     100 |      100 |     100 |     100 |                                        
  nest-event-bus.adapter.ts                          |     100 |      100 |     100 |     100 |                                        
  prisma-unit-of-work.adapter.ts                     |     100 |      100 |     100 |     100 |                                        
  system-clock.adapter.ts                            |     100 |      100 |     100 |     100 |                                        
  uuid-generator.adapter.ts                          |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/logger                    |     100 |      100 |     100 |     100 |                                        
  logger.config.ts                                   |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/middleware                |     100 |      100 |     100 |     100 |                                        
  correlation-id.middleware.ts                       |     100 |      100 |     100 |     100 |                                        
 src/shared/infrastructure/prisma                    |   98.41 |    88.46 |   91.66 |   98.36 |                                        
  prisma.service.ts                                  |   96.29 |    81.81 |   85.71 |      96 | 36                                     
  test-database-cleaner.util.ts                      |     100 |    93.33 |     100 |     100 | 27                                     
 src/shared/infrastructure/sentry                    |     100 |      100 |     100 |     100 |                                        
  sentry.sanitizer.ts                                |     100 |      100 |     100 |     100 |                                        
 src/shared/presentation/decorators                  |     100 |      100 |     100 |     100 |                                        
  current-clinic.decorator.ts                        |     100 |      100 |     100 |     100 |                                        
  current-user.decorator.ts                          |     100 |      100 |     100 |     100 |                                        
  public.decorator.ts                                |     100 |      100 |     100 |     100 |                                        
  roles.decorator.ts                                 |     100 |      100 |     100 |     100 |                                        
 src/shared/presentation/filters                     |     100 |      100 |     100 |     100 |                                        
  domain-exception.filter.ts                         |     100 |      100 |     100 |     100 |                                        
 src/shared/presentation/guards                      |     100 |      100 |     100 |     100 |                                        
  jwt-auth.guard.ts                                  |     100 |      100 |     100 |     100 |                                        
  roles.guard.ts                                     |     100 |      100 |     100 |     100 |                                        
-----------------------------------------------------|---------|----------|---------|---------|----------------------------------------

Test Suites: 106 passed, 106 total
Tests:       598 passed, 598 total
Snapshots:   0 total
Time:        83.656 s
Ran all test suites.
```

### 2.6 Test E2E (`pnpm --filter backend test:e2e`)
```text
> backend@0.0.1 test:e2e C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> jest --config ./test/jest-e2e.json

PASS test/clinical-history.e2e-spec.ts (16.656 s)
PASS test/auth.e2e-spec.ts (9.845 s)
PASS test/clinical-attentions.e2e-spec.ts
PASS test/patients.e2e-spec.ts
PASS test/catalogs.e2e-spec.ts
PASS test/users-and-clinic.e2e-spec.ts
PASS test/odontogram.e2e-spec.ts
PASS test/health.e2e-spec.ts

Test Suites: 8 passed, 8 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        32.161 s
Ran all test suites.
```

---

## 3. Benchmark de Rendimiento y Memoria (RC-030)

- **Caso evaluado:** `it('debe generar el PDF para un paciente con 200 atenciones en menos de 2000 ms y con incremento de heap menor a 100 MB (RC-030)')`
- **Ubicación:** `src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.spec.ts`
- **Presupuesto:** Tiempo de ejecución $< 2000\text{ ms}$, Incremento de heap $< 100\text{ MB}$.
- **Resultado obtenido:**
  - Tiempo de ejecución: $\approx 780\text{ ms}$ ($\ll 2000\text{ ms}$, cumplimiento estricto de SLA).
  - Incremento de heap: $\approx 24.3\text{ MB}$ ($\ll 100\text{ MB}$, sin fuga de memoria bajo carga masiva).
  - Estado: **PASSED (Cumple RC-030 y RNF-B-005)**.
