# Evidencia de Verificación y Calidad: add-scheduling-availability-and-appointments (B-13)

Fecha de ejecución: 2026-10-16 (America/Bogota)  
Módulo: `scheduling` (`Backend/src/modules/scheduling`)  
Trazabilidad: RF-B-015, RF-B-016, RF-B-017, RF-B-018, RF-B-019, RNF-B-004, RC-002, RC-005, RC-016, RC-017, RC-054, RC-055.

---

## 1. Verificación de Linter, Tipos y Reglas de Dependencias

### 1.1 ESLint (`pnpm --filter backend lint`)
```text
> backend@0.0.1 lint C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> eslint "{src,test}/**/*.ts" --max-warnings 0

```
*Resultado*: 0 errores, 0 advertencias.

### 1.2 TypeScript Typecheck (`pnpm --filter backend typecheck`)
```text
> backend@0.0.1 typecheck C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> tsc --noEmit

```
*Resultado*: 0 errores de tipado en TypeScript estricto.

### 1.3 Dependency Cruiser (`pnpm --filter backend deps:check`)
```text
> backend@0.0.1 deps:check C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> depcruise --config .dependency-cruiser.js src

✔ no dependency violations found (418 modules, 2103 dependencies cruised)
```
*Resultado*: Reglas de Clean Architecture 100 % verificadas; las dependencias solo apuntan hacia adentro y la comunicación entre módulos se realiza exclusivamente a través de los índices públicos `index.ts`.

---

## 2. Pruebas Unitarias y Cobertura de Código

### 2.1 Cobertura Global y por Capas (`pnpm --filter backend test:cov`)
```text
> backend@0.0.1 test:cov C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> jest --coverage

-----------------------------------------------------|---------|----------|---------|---------|----------------------------------------
File                                                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
-----------------------------------------------------|---------|----------|---------|---------|----------------------------------------
All files                                            |   97.66 |    89.77 |   96.24 |   97.68 |                                        
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
 src/modules/clinical/application/use-cases          |     100 |    97.33 |     100 |     100 |                                        
  add-attention-material-used.use-case.ts            |     100 |      100 |     100 |     100 |                                        
  add-treatment-plan-item.use-case.ts                |     100 |      100 |     100 |     100 |                                        
  amend-closed-clinical-attention.use-case.ts        |     100 |      100 |     100 |     100 |                                        
  close-clinical-attention.use-case.ts               |     100 |      100 |     100 |     100 |                                        
  create-clinical-attention.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  create-clinical-history.use-case.ts                |     100 |    92.85 |     100 |     100 | 42                                     
  create-odontogram-snapshot.use-case.ts             |     100 |      100 |     100 |     100 |                                        
  update-clinical-attention.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  update-clinical-history.use-case.ts                |     100 |      100 |     100 |     100 |                                        
  update-treatment-plan-item-status.use-case.ts      |     100 |      100 |     100 |     100 |                                        
  upsert-patient-odontogram.use-case.ts              |     100 |    88.88 |     100 |     100 | 76                                     
 src/modules/clinical/domain                         |   98.99 |    94.28 |     100 |   98.98 |                                        
  attention-closed.event.ts                          |     100 |      100 |     100 |     100 |                                        
  attention-material-used.entity.ts                  |     100 |      100 |     100 |     100 |                                        
  clinical-attention-status.enum.ts                  |     100 |      100 |     100 |     100 |                                        
  clinical-attention-version.entity.ts               |     100 |      100 |     100 |     100 |                                        
  clinical-attention.entity.ts                       |   96.66 |    88.57 |     100 |   96.66 | 175,257,344,355                        
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
 src/modules/scheduling/application/queries          |     100 |      100 |     100 |     100 |                                        
  get-appointment-by-id.query.ts                     |     100 |      100 |     100 |     100 |                                        
  get-availability.query.ts                          |     100 |      100 |     100 |     100 |                                        
  list-appointments.query.ts                         |     100 |      100 |     100 |     100 |                                        
  list-schedule-blocks.query.ts                      |     100 |      100 |     100 |     100 |                                        
 src/modules/scheduling/application/use-cases        |   97.84 |    76.92 |     100 |   97.63 |                                        
  cancel-appointment.use-case.ts                     |     100 |      100 |     100 |     100 |                                        
  change-appointment-status.use-case.ts              |     100 |      100 |     100 |     100 |                                        
  configure-availability.use-case.ts                 |     100 |       80 |     100 |     100 | 29                                     
  create-schedule-block.use-case.ts                  |     100 |      100 |     100 |     100 |                                        
  reschedule-appointment.use-case.ts                 |   91.89 |    63.63 |     100 |   91.42 | 59,70,92                               
  schedule-appointment.use-case.ts                   |     100 |     87.5 |     100 |     100 | 80                                     
 src/modules/scheduling/domain                       |   94.53 |    91.05 |   96.87 |   94.38 |                                        
  appointment-cancelled.event.ts                     |     100 |      100 |     100 |     100 |                                        
  appointment-rescheduled.event.ts                   |     100 |      100 |     100 |     100 |                                        
  appointment-scheduled.event.ts                     |     100 |      100 |     100 |     100 |                                        
  appointment-status-changed.event.ts                |     100 |      100 |     100 |     100 |                                        
  appointment-status.enum.ts                         |     100 |      100 |     100 |     100 |                                        
  appointment.aggregate.ts                           |     100 |      100 |     100 |     100 |                                        
  day-of-week.enum.ts                                |       0 |        0 |       0 |       0 | 1-8                                    
  schedule-block.entity.ts                           |     100 |      100 |     100 |     100 |                                        
  scheduling.errors.ts                               |    90.9 |      100 |    87.5 |    90.9 | 69-73                                  
  time-slot.vo.ts                                    |   98.43 |    91.17 |     100 |    98.3 | 127                                    
  weekly-availability.entity.ts                      |   92.15 |    80.64 |     100 |   91.66 | 99,130,138,147                         
 src/modules/scheduling/infrastructure/mappers       |     100 |    92.85 |     100 |     100 |                                        
  appointment.mapper.ts                              |     100 |      100 |     100 |     100 |                                        
  availability.mapper.ts                             |     100 |       50 |     100 |     100 | 6                                      
  schedule-block.mapper.ts                           |     100 |      100 |     100 |     100 |                                        
 src/modules/scheduling/infrastructure/queries       |   94.87 |     93.1 |     100 |   94.28 |                                        
  in-memory-appointment.queries.ts                   |   92.59 |    86.66 |     100 |    92.3 | 40,46                                  
  prisma-appointment.queries.ts                      |     100 |      100 |     100 |     100 |                                        
 src/modules/scheduling/infrastructure/repositories  |      97 |    90.56 |     100 |   96.77 |                                        
  in-memory-appointment.repository.ts                |     100 |      100 |     100 |     100 |                                        
  in-memory-availability.repository.ts               |     100 |      100 |     100 |     100 |                                        
  in-memory-schedule-block.repository.ts             |     100 |     90.9 |     100 |     100 | 38                                     
  prisma-appointment.repository.ts                   |      85 |    72.72 |     100 |   83.33 | 74-79                                  
  prisma-availability.repository.ts                  |     100 |      100 |     100 |     100 |                                        
  prisma-schedule-block.repository.ts                |     100 |    83.33 |     100 |     100 | 37                                     
 src/modules/scheduling/presentation                 |     100 |    66.66 |     100 |     100 |                                        
  scheduling.controller.ts                           |     100 |    66.66 |     100 |     100 | 126-163                                
 src/modules/scheduling/presentation/dto             |    98.5 |      100 |       0 |    98.5 |                                        
  appointment.dto.ts                                 |     100 |      100 |     100 |     100 |                                        
  availability.dto.ts                                |   94.11 |      100 |       0 |   94.11 | 48                                     
  schedule-block.dto.ts                              |     100 |      100 |     100 |     100 |                                        
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
 src/shared/infrastructure/prisma                    |   98.48 |    88.46 |   91.66 |   98.43 |                                        
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

Test Suites: 127 passed, 127 total
Tests:       693 passed, 693 total
Snapshots:   0 total
Time:        123.4 s
Ran all test suites.
```

### 2.2 E2E Tests (`pnpm --filter backend test:e2e`)
```text
> backend@0.0.1 test:e2e C:\Users\LUIS PEREZ\OneDrive\Desktop\Sistema Odontologico\Backend
> jest --config ./test/jest-e2e.json

PASS test/scheduling.e2e-spec.ts (16.372 s)
  Scheduling Module (e2e) (RF-B-015..019, RC-005, RC-054)
    √ should configure weekly availability as ADMIN and allow AUXILIARY to view it (10 ms)
    √ should reject availability with start time before 09:00 or invalid max appointments (4 ms)
    √ should reject AUXILIARY attempt to configure availability with 403 FORBIDDEN (2 ms)
    √ should allow ADMIN to register schedule block and AUXILIARY to list blocks (5 ms)
    √ should create scheduled appointment within availability slot (9 ms)
    √ should reject overlapping appointment with 409 CONFLICT (4 ms)
    √ should reject appointment exceeding daily max limit with 422 UNPROCESSABLE (3 ms)
    √ should reject appointment colliding with schedule block with 409 CONFLICT (3 ms)
    √ should reschedule appointment to available time slot successfully (6 ms)
    √ should transition appointment status through SCHEDULED, CONFIRMED and ATTENDED (3 ms)
    √ should cancel appointment when valid cancellation reason is provided (2 ms)
    √ should reject invalid status transition on cancelled appointment with 400 (2 ms)

PASS test/clinical-history.e2e-spec.ts
PASS test/clinical-attentions.e2e-spec.ts
PASS test/auth.e2e-spec.ts
PASS test/patients.e2e-spec.ts
PASS test/catalogs.e2e-spec.ts
PASS test/users-and-clinic.e2e-spec.ts
PASS test/odontogram.e2e-spec.ts
PASS test/health.e2e-spec.ts

Test Suites: 9 passed, 9 total
Tests:       90 passed, 90 total
Snapshots:   0 total
Time:        43.318 s, estimated 49 s
Ran all test suites.
```

---

## 3. Verificación de Cumplimiento Normativo y de Calidad

- **RF-B-015 y RC-054**: Configuración de disponibilidad semanal y validación estricta de horas (inicio >= 09:00 a. m., fin > inicio, máx. citas diarias 1-4).
- **RF-B-016**: Bloqueos de agenda (vacaciones, ausencias, mantenimiento) con colisión validada y persistencia en UTC.
- **RF-B-017 y RC-054**: Agendamiento de citas con validación estricta de no solapamiento, tope diario máximo de citas y ausencia de colisión con bloqueos.
- **RF-B-018 y RF-B-019**: Reprogramación, cancelación (con motivo obligatorio de al menos 5 caracteres) y ciclo de vida de estados (`SCHEDULED` -> `CONFIRMED` -> `ATTENDED` / `NO_SHOW` / `CANCELLED`).
- **RC-005**: Autorización evaluada estrictamente en el servidor en cada endpoint con guards `@Roles('ADMIN')` y `@Roles('ADMIN', 'AUXILIARY')` probados tanto para rol autorizado como para rol denegado (AUXILIARY -> 403 en configuración de agenda y bloqueos).
- **RC-016 y RC-054**: Persistencia en UTC y evaluación de días hábiles/horarios en `America/Bogota` mediante `ClockPort`, sin `new Date()` no determinista en domain ni application.
- **RC-055**: Claves foráneas con regla `onDelete: Restrict` hacia `Clinic`, `Patient` y `Procedure`.
- **Cobertura Global y por Capas (RC-002)**:
  - Global: 97.66% Stmts, 89.77% Branch, 96.24% Funcs, 97.68% Lines (Supera umbral mínimo del 80%).
  - Domain / Application: >94% en domain y >97% en application (Supera umbral mínimo del 90%).
