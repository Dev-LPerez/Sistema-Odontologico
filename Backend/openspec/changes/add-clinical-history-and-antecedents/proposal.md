# Proposal

## Why
Con los módulos `patients` y `catalogs` completados y archivados, el siguiente paso del MVP es iniciar `modules/clinical` implementando la apertura y gestión de la historia clínica única por paciente. La Dra. Angelee Pacheco necesita registrar el motivo de consulta, la enfermedad actual, los antecedentes médicos personales y familiares (hipertensión, diabetes, alergias, medicación), el examen clínico con diagnósticos y el plan de tratamiento vinculado al catálogo de procedimientos con sus estados (`PENDING`, `IN_PROGRESS`, `COMPLETED`) y costos en COP.

- **Requisitos cubiertos:** RF-B-020, RF-B-021, RF-B-022, RF-B-023, RNF-B-004, RNF-B-009, RNF-B-012, RNF-B-032, RC-001, RC-002, RC-003, RC-005, RC-012, RC-015, RC-016, RC-017, RC-018, RC-023, RC-050, RC-055, RC-070, RC-074.
- **Change equivalente en Frontend:** `add-clinical-history-and-antecedents-ui`.

## What Changes
- Agregar en `Backend/prisma/schema.prisma` el enum `TreatmentItemStatus` (`PENDING`, `IN_PROGRESS`, `COMPLETED`) y los modelos `ClinicalHistory` y `TreatmentPlanItem` con `clinicId` obligatorio y claves foráneas con `onDelete: Restrict` (`RC-055`).
- Ampliar las rutas de redacción clínica en `logger.config.ts` y `sentry.sanitizer.ts` para censurar `chiefComplaint`, `currentIllness`, `personalAntecedents`, `familyAntecedents`, `clinicalExamination`, `diagnoses`, `allergiesDetails` y `medicationsDetails` (`RNF-B-009`, `RC-023`).
- Implementar la capa `domain` de `modules/clinical`: objeto de valor `MedicalAntecedents`, entidad hija `TreatmentPlanItem`, agregado raíz `ClinicalHistory`, errores de dominio y puerto `ClinicalHistoryRepositoryPort`.
- Implementar la capa `application`: casos de uso `CreateClinicalHistoryUseCase`, `UpdateClinicalHistoryUseCase`, `AddTreatmentPlanItemUseCase` (resolviendo precio especial por paciente o precio base de `modules/catalogs`), `UpdateTreatmentPlanItemStatusUseCase` y consulta `GetClinicalHistoryByPatientQuery`.
- Implementar la capa `infrastructure` con repositorios `InMemory` y `Prisma`, traducción de colisiones `P2002` a `DuplicateClinicalHistoryError` (`409`) y suite de contrato contra PostgreSQL real (`RC-018`, `RC-050`).
- Exponer `ClinicalHistoryController` (`/v1/clinical-histories/...`) con pruebas E2E de permisos por rol (`RC-005`) y regenerar `Backend/openapi.json`.

## Capabilities

### New Capabilities
- `clinical-history-management`: Gestión de la historia clínica única por paciente, antecedentes médicos personales y familiares, examen clínico, diagnósticos y plan de tratamiento con estados y costos asociados.

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/prisma/migrations/`, `Backend/src/shared/infrastructure/`, `Backend/src/modules/clinical/`, `Backend/src/app.module.ts`, `Backend/jest.config.ts`, `Backend/test/clinical-history.e2e-spec.ts`, `Backend/openapi.json`.