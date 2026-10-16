# Proposal

## Why
Con la historia clínica y el plan de tratamiento (`B-08`), el odontograma estructurado (`B-09`), las atenciones clínicas con materiales (`B-10`) y su cierre y versionado inmutable (`B-11`) completados, el paso final del módulo `modules/clinical` es permitir a la Dra. Angelee Pacheco exportar la historia clínica completa de un paciente en formato PDF (`RF-B-031`). Este documento consolidado con membrete del consultorio es indispensable para entregar copia formal al paciente o para respaldo clínico, garantizando que las notas privadas confidenciales (`privateNotes`) nunca se incluyan en el PDF (`RF-B-027`).

- **Requisitos cubiertos:** RF-B-027, RF-B-031, RNF-B-004, RNF-B-009, RNF-B-012, RNF-B-032, RC-001, RC-002, RC-003, RC-005, RC-012, RC-015, RC-016, RC-017, RC-023, RC-050, RC-054, RC-070, RC-074.
- **Change equivalente en Frontend:** `add-clinical-history-and-antecedents-ui`.

## What Changes
- Instalar `pdfmake` y `@types/pdfmake` en `Backend/package.json` conforme al stack tecnológico oficial del Backend.
- Declarar en `application/ports` de `modules/clinical` el puerto `ClinicalHistoryPdfGeneratorPort` (`CLINICAL_HISTORY_PDF_GENERATOR_PORT`) desacoplando la lógica de aplicación de la librería de renderizado PDF.
- Implementar en `application/queries` la consulta `ExportClinicalHistoryPdfQuery` que recopila los datos del consultorio (`ClinicRepositoryPort`), del paciente (`PatientRepositoryPort`), su historia clínica y plan de tratamiento (`ClinicalHistoryRepositoryPort`), su odontograma actual (`OdontogramRepositoryPort`) y sus atenciones clínicas (`ClinicalAttentionRepositoryPort`), excluyendo estrictamente `privateNotes` y formateando fechas en zona horaria `America/Bogota` mediante `ClockPort` (`RC-016`, `RC-054`).
- Implementar en `infrastructure/adapters` el adaptador `PdfmakeClinicalHistoryPdfGeneratorAdapter` usando fuentes estándar PDF (`Helvetica`) sin depender de archivos externos en disco, junto con su suite de pruebas de contrato/integración verificando la generación de un `Buffer` `%PDF-` válido y la ausencia total de `privateNotes`.
- Exponer en `ClinicalHistoryController` el endpoint `GET /v1/clinical-histories/patient/:patientId/pdf` exclusivo para el rol `ADMIN` (`RC-005`), con pruebas E2E y actualización de `Backend/openapi.json`.

## Capabilities

### New Capabilities
*(Ninguna)*

### Modified Capabilities
- `clinical-history-management`: Se agrega el requisito de exportación de la historia clínica completa del paciente en formato PDF con membrete del consultorio, datos demográficos, antecedentes, odontograma, plan de tratamiento y evoluciones, excluyendo las notas privadas confidenciales.

## Impact
- **Código afectado:** `Backend/package.json`, `Backend/src/modules/clinical/`, `Backend/test/clinical-history.e2e-spec.ts`, `Backend/openapi.json`.