# Design

## Context
El módulo `modules/clinical` concentra el expediente clínico del paciente. Para respetar el límite de ~400 líneas por cambio (`RC-014`), su construcción está dividida en cinco entregas atómicas: historia clínica, antecedentes y plan de tratamiento (**B-08**), odontograma JSONB e instantáneas (**B-09**), atenciones clínicas con descuento de materiales y notas privadas (**B-10**), cierre y versionado inmutable (**B-11**) y exportación a PDF (**B-12**). En **B-08** establecemos el agregado `ClinicalHistory` con sus antecedentes médicos y su plan de tratamiento consumiendo las APIs públicas de `modules/patients` y `modules/catalogs` (`RC-017`).

## Goals / Non-Goals

**Goals:**
- Garantizar mediante restricción única compuesta `@@unique([clinicId, patientId])` y manejo de `P2002` que cada paciente tenga una única historia clínica en el consultorio (`RF-B-020`).
- Validar en el dominio que si el paciente reporta alergias (`allergies: true`) o medicación activa (`medications: true`), sea obligatorio especificar el detalle (`RF-B-021`).
- Permitir registrar ítems en el plan de tratamiento vinculados a procedimientos reales de `modules/catalogs`, tomando automáticamente la tarifa personalizada del paciente (si existe) o el precio base del procedimiento cuando no se especifique un costo manual (`RF-B-023`).
- Proteger todas las relaciones con `onDelete: Restrict` (`RNF-B-012`, `RC-055`) y redactar todos los campos clínicos nuevos en Pino y Sentry (`RNF-B-009`, `RC-023`).

**Non-Goals:**
- Odontograma estructurado de 32 dientes por superficie e instantáneas (corresponde a **B-09 `add-odontogram-management`**).
- Evoluciones por atención, materiales usados y notas privadas (corresponde a **B-10 `add-clinical-attentions-and-materials`**).

## Decisions

1. **Esquema Prisma con `onDelete: Restrict` (`RC-055`):**
   - `TreatmentItemStatus`: enum `{ PENDING IN_PROGRESS COMPLETED }`.
   - `ClinicalHistory` (`@@map("clinical_histories")`): `id`, `clinicId`, `patientId`, `chiefComplaint`, `currentIllness`, `personalAntecedents` (`Json`), `familyAntecedents` (`String?`), `clinicalExamination` (`String?`), `diagnoses` (`Json`), `createdAt`, `updatedAt`. Restricción `@@unique([clinicId, patientId])` e índice `@@index([clinicId, patientId])`. FKs a `Clinic` y `Patient` con `onDelete: Restrict`.
   - `TreatmentPlanItem` (`@@map("treatment_plan_items")`): `id`, `clinicId`, `clinicalHistoryId`, `procedureId`, `procedureCode`, `procedureName`, `toothNumber` (`String?`), `status` (`TreatmentItemStatus`, default `PENDING`), `estimatedCostCop` (`Int`), `notes` (`String?`), `createdAt`, `updatedAt`. Índice `@@index([clinicId, clinicalHistoryId])`. FKs a `Clinic`, `ClinicalHistory` y `Procedure` con `onDelete: Restrict`.

2. **Agregado `ClinicalHistory`, `MedicalAntecedents` VO y `TreatmentPlanItem`:**
   - `MedicalAntecedents` encapsula `hypertension`, `diabetes`, `allergies`, `allergiesDetails`, `medications`, `medicationsDetails`, `bleedingDisorders`, `pregnancy`, `otherNotes` y `familyAntecedents`. Lanza `InvalidClinicalHistoryDataError` (`400`) si `allergies === true` y `allergiesDetails` está vacío, o si `medications === true` y `medicationsDetails` está vacío.
   - `ClinicalHistory` mantiene la colección de `TreatmentPlanItem`, calcula `totalEstimatedCostCop` y expone `addTreatmentPlanItem` y `updateTreatmentPlanItemStatus`.
   - `ClinicalHistoryRepositoryPort` (`CLINICAL_HISTORY_REPOSITORY_PORT`) define 3 métodos: `findById`, `findByPatientId` y `save` (persistiendo atómicamente la cabecera y sus `treatmentItems`).

3. **Integración entre Módulos vía `index.ts` Público (`RC-017`):**
   - `CreateClinicalHistoryUseCase` importa `PATIENT_REPOSITORY_TOKEN`, `PatientRepositoryPort` y `PatientNotFoundError` desde `../../patients`.
   - `AddTreatmentPlanItemUseCase` importa `PROCEDURE_REPOSITORY_PORT`, `PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT`, `ProcedureNotFoundError` y `Money` desde `../../catalogs`.

4. **Control de Acceso por Rol (`RNF-B-004`, `RC-005`):**
   - `GET /v1/clinical-histories/patient/:patientId`: permitido para `ADMIN` y `AUXILIARY` (para visualizar alertas médicas y plan en la ficha).
   - `POST /v1/clinical-histories`, `PATCH /v1/clinical-histories/patient/:patientId`, `POST /v1/clinical-histories/patient/:patientId/treatment-plan-items` y `PATCH /v1/clinical-histories/patient/:patientId/treatment-plan-items/:itemId/status`: exclusivos para `ADMIN` (retornan `403 FORBIDDEN_ROLE` a `AUXILIARY`).

## Risks / Trade-offs
- **[Risk] Filtración accidental de motivo de consulta, antecedentes o diagnósticos en logs o Sentry** → *Mitigación:* Añadir `chiefComplaint`, `currentIllness`, `personalAntecedents`, `familyAntecedents`, `clinicalExamination`, `diagnoses`, `allergiesDetails` y `medicationsDetails` en `CLINICAL_REDACT_PATHS` y `SENSITIVE_KEYS` con prueba unitaria obligatoria.