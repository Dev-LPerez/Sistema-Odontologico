# Proposal

## Why
Con el módulo `identity` cerrado y archivado, el siguiente paso en la ruta del MVP es construir `modules/patients` como **módulo de referencia documentado** de Clean Architecture y TDD. Este cambio establece el registro clínico-demográfico de pacientes sin borrado físico, la autorización explícita de tratamiento de datos sensibles exigida por la Ley 1581 de 2012, la fuente de captación para analítica y la detección de posibles duplicados por documento o teléfono.

- **Requisitos cubiertos:** RF-B-010, RF-B-011, RF-B-013, RF-B-014, RNF-B-004, RNF-B-009, RNF-B-010, RNF-B-011, RNF-B-032, RC-005, RC-012, RC-015, RC-016, RC-018, RC-055, RC-074.
- **Change equivalente en Frontend:** `add-patients-and-catalogs-ui`.

## What Changes
- Crear en `Backend/prisma/schema.prisma` los enums `DocumentType` (`CC`, `TI`, `RC`, `CE`, `PAS`, `OTHER`) y `AcquisitionSource` (`REFERRAL`, `INSTAGRAM`, `WHATSAPP`, `DIRECT`, `OTHER`) y el modelo `Patient` con `clinicId`, campos demográficos, contacto de emergencia, consentimiento Ley 1581 y estado `isActive`.
- Implementar la capa `domain` de `modules/patients`: agregado `Patient`, objetos de valor (`DocumentIdentity`, `PhoneNumber`, `EmergencyContact`), errores de dominio (`DataTreatmentConsentRequiredError`, `DuplicatePatientDocumentError`, `PatientNotFoundError`, `InvalidPatientDataError`) y puerto `PatientRepositoryPort` (máx. 5 métodos, ISP).
- Implementar la capa `application`: casos de uso `CreatePatientUseCase`, `UpdatePatientUseCase`, `ChangePatientStatusUseCase` y consultas `GetPatientByIdQuery`, `ListPatientsQuery` y `DetectDuplicatePatientsQuery`.
- Implementar la capa `infrastructure`: `InMemoryPatientRepository`, `PrismaPatientRepository`, `PatientMapper` y suite de pruebas de contrato (`RC-018`).
- Implementar la capa `presentation`: `PatientsController` (`/v1/patients`) con pruebas unitarias y E2E de permisos por rol (`ADMIN` y `AUXILIARY`, restringiendo la desactivación a `ADMIN`, `RC-005`).

## Capabilities

### New Capabilities
- `patients-management`: Gestión integral de pacientes del consultorio (creación con consentimiento Ley 1581 obligatorio, consulta, listado, edición, desactivación lógica sin borrado físico y detección de posibles duplicados por documento o teléfono).

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/src/modules/patients/`, `Backend/src/app.module.ts`, `Backend/test/patients.e2e-spec.ts`, `Backend/openapi.json`.
- **Base de datos:** Nueva migración Prisma para la tabla `patients` con índice único compuesto `@@unique([clinicId, documentType, documentNumber])` e índices en `[clinicId, isActive]` y `[clinicId, phone]`.