# Design

## Context
En **B-08 (`add-clinical-history-and-antecedents`)** construimos la historia clínica única del paciente y su plan de tratamiento dentro de `modules/clinical`. En **B-09 (`add-odontogram-management`)** incorporamos el odontograma estructurado en `JSONB` y sus instantáneas históricas por fecha (`RF-B-040` a `RF-B-044`), manteniendo el cambio por debajo de ~400 líneas productivas (`RC-014`) y preparando el modelo estructurado que consumirá la exportación a PDF en **B-12** y el odontograma SVG interactivo en **F-06**.

## Goals / Non-Goals

**Goals:**
- Soportar las **32 piezas dentales permanentes** (cuadrantes 1 a 4: `11..18`, `21..28`, `31..38`, `41..48`) y opcionalmente las **20 piezas de dentición temporal** (cuadrantes 5 a 8: `51..55`, `61..65`, `71..75`, `81..85`) bajo nomenclatura FDI (`RF-B-040`).
- Validar superficies dentales (`OCCLUSAL`, `VESTIBULAR`, `LINGUAL`, `MESIAL`, `DISTAL`, `WHOLE_TOOTH`) y un catálogo extensible de hallazgos estandarizados (`CARIES`, `RESIN_RESTORATION`, `AMALGAM_RESTORATION`, `ABSENT`, `EXTRACTION_INDICATED`, `CALCULUS`, `PERIODONTAL_POCKET`, `CROWN`, `ENDODONTICS`, `SEALANT`, `FRACTURE`) distinguiendo estado (`EXISTING`, `PLANNED`, `PERFORMED`) (`RF-B-041`, `RF-B-042`).
- Persistir el estado del odontograma en formato `JSONB` estructurado y permitir capturar instantáneas (`OdontogramSnapshot`) inmutables por fecha (`RF-B-043`, `RF-B-044`).
- Proteger todas las claves foráneas con `onDelete: Restrict` (`RC-055`) y redactar `teethState` y `snapshotData` en Pino y Sentry (`RC-023`).

**Non-Goals:**
- Registro de atenciones clínicas y descuento de materiales por diente (corresponde a **B-10 `add-clinical-attentions-and-materials`**).
- Renderizado de documento PDF (corresponde a **B-12 `add-clinical-history-pdf-export`**).

## Decisions

1. **Esquema Prisma con `JSONB` y `onDelete: Restrict` (`RF-B-044`, `RC-055`):**
   - `Odontogram` (`@@map("odontograms")`): `id`, `clinicId`, `patientId`, `hasTemporalDentition` (`Boolean`, default `false`), `teethState` (`Json`), `createdAt`, `updatedAt`. Restricción `@@unique([clinicId, patientId])` e índice `@@index([clinicId, patientId])`. FKs a `Clinic` y `Patient` con `onDelete: Restrict`.
   - `OdontogramSnapshot` (`@@map("odontogram_snapshots")`): `id`, `clinicId`, `patientId`, `odontogramId`, `hasTemporalDentition` (`Boolean`), `snapshotData` (`Json`), `notes` (`String?`), `createdAt`. Índice `@@index([clinicId, patientId, createdAt])`. FKs a `Clinic`, `Patient` y `Odontogram` con `onDelete: Restrict`.

2. **Objetos de Valor y Reglas Puras en `domain` (OCP y SRP):**
   - `ToothNumber`: valida código FDI exacto y determina si la pieza es permanente (`11-18`, `21-28`, `31-38`, `41-48`) o temporal (`51-55`, `61-65`, `71-75`, `81-85`). Lanza `InvalidOdontogramDataError` (`400`) ante cualquier otro código (ej. `"19"`, `"56"`, `"99"`).
   - `ToothFinding`: encapsula `toothNumber` (`ToothNumber`), `surface` (`ToothSurface`), `findingCode` (`FindingCatalogCode`), `status` (`FindingStatus`: `EXISTING`, `PLANNED`, `PERFORMED`) y `notes` opcional. Si el odontograma tiene `hasTemporalDentition === false` y se intenta registrar un hallazgo sobre una pieza temporal (`51-85`), `Odontogram` lanza `InvalidOdontogramDataError` (`400`).
   - `Odontogram.toStructuredJson()` devuelve la representación determinista lista para `JSONB` y para el futuro generador SVG/PDF (`RF-B-044`).

3. **Segregación de Puertos (ISP $\le 5$ métodos):**
   - `OdontogramRepositoryPort` (`ODONTOGRAM_REPOSITORY_PORT`): `findByPatientId`, `save` (2 métodos).
   - `OdontogramSnapshotRepositoryPort` (`ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT`): `findAllByPatientId`, `save` (2 métodos).

4. **Control de Acceso por Rol (`RNF-B-004`, `RC-005`):**
   - `GET /v1/odontograms/patient/:patientId` y `GET /v1/odontograms/patient/:patientId/snapshots`: permitidos para `ADMIN` y `AUXILIARY`.
   - `PUT /v1/odontograms/patient/:patientId` y `POST /v1/odontograms/patient/:patientId/snapshots`: exclusivos para `ADMIN` (retornan `403 FORBIDDEN_ROLE` a `AUXILIARY`).

## Risks / Trade-offs
- **[Risk] Mutación accidental de una instantánea histórica al editar el odontograma activo** → *Mitigación:* `OdontogramSnapshot` realiza una copia profunda inmutable (`structuredClone` / serialización de objetos de valor) de `findings` en el instante de creación.