# Design

## Context
En los cambios **B-08** a **B-11** construimos todos los agregados del expediente clínico dentro de `modules/clinical`: `ClinicalHistory` (con `MedicalAntecedents` y `TreatmentPlanItem`), `Odontogram` y `ClinicalAttention` (con `AttentionMaterialUsed` y `ClinicalAttentionVersion`). En **B-12 (`add-clinical-history-pdf-export`)** cerramos el módulo `clinical` implementando la exportación en PDF del expediente clínico completo (`RF-B-031`) mediante `pdfmake` detrás de un puerto de aplicación, manteniendo el cambio bajo ~400 líneas (`RC-014`).

- **Módulo y capas afectadas:** `modules/clinical` (`application`, `infrastructure`, `presentation`).
- **Puertos nuevos:** `ClinicalHistoryPdfGeneratorPort` (`CLINICAL_HISTORY_PDF_GENERATOR_PORT`) en `Backend/src/modules/clinical/application/ports/clinical-history-pdf-generator.port.ts`.
- **Eventos de dominio:** Ninguno.
- **Esquema Prisma:** No requiere nuevas tablas ni migraciones; lee de los repositorios existentes aislando siempre por `clinicId` (`RNF-B-032`).
- **ADR:** No requiere nuevo ADR; sigue la arquitectura de puertos y adaptadores definida en `ADR-0001`.

## Goals / Non-Goals

**Goals:**
- Permitir exclusivamente al rol `ADMIN` descargar el PDF consolidado de la historia clínica de un paciente de su consultorio (`GET /v1/clinical-histories/patient/:patientId/pdf`) (`RF-B-031`, `RNF-B-004`, `RC-005`).
- Incluir en el PDF: encabezado con datos del consultorio (`Clinic`), datos demográficos del paciente (`Patient`), motivo de consulta, enfermedad actual, antecedentes médicos personales y familiares, examen clínico, diagnósticos, estado del odontograma (si existe), plan de tratamiento con costos en COP y listado cronológico de atenciones clínicas con procedimientos, evolución, prescripción, indicaciones y materiales usados.
- Garantizar por diseño en `ExportClinicalHistoryPdfQuery` que el campo `privateNotes` de las atenciones clínicas **nunca** forme parte del modelo de datos entregado al generador de PDF (`RF-B-027`, `RNF-B-009`, `RC-023`).
- Formatear las fechas del documento en la zona horaria `America/Bogota` a través de `ClockPort` sin usar `new Date()` en `domain` ni en `application` (`RC-016`, `RC-054`).

**Non-Goals:**
- Almacenar el PDF generado en Cloudflare R2 (la historia clínica se genera bajo demanda en memoria reflejando el estado más reciente del expediente; el almacenamiento en R2 de archivos adjuntos y consentimientos corresponde a `modules/files` en **B-15** y **B-16**).

## Decisions

1. **Puerto `ClinicalHistoryPdfGeneratorPort` en `application/ports` (`RC-012`, `RC-015`):**
   - Define una estructura tipada `ClinicalHistoryPdfDocumentData` que contiene únicamente los datos públicos del expediente (`clinic`, `patient`, `history`, `odontogram`, `attentions`, `generatedAtFormatted`) omitiendo `privateNotes`.
   - Expone un único método: `generate(data: ClinicalHistoryPdfDocumentData): Promise<Buffer>`.

2. **Orquestación en `ExportClinicalHistoryPdfQuery` Respetando Fronteras de Módulos (`RC-017`):**
   - Importa `CLINIC_REPOSITORY_PORT`, `ClinicRepositoryPort` y `ClinicNotFoundError` desde `../../../identity` (su `index.ts` público).
   - Importa `PATIENT_REPOSITORY_TOKEN`, `PatientRepositoryPort` y `PatientNotFoundError` desde `../../../patients` (su `index.ts` público).
   - Consulta `ClinicalHistoryRepositoryPort.findByPatientId(clinicId, patientId)` (si no existe, lanza `ClinicalHistoryNotFoundError` `404`), `OdontogramRepositoryPort.findByPatientId(clinicId, patientId)` y `ClinicalAttentionRepositoryPort.findAllByPatientId(clinicId, patientId)`.
   - Devuelve `{ buffer: Buffer, filename: string, contentType: 'application/pdf' }` donde `filename` usa el UUID del paciente (`historia-clinica-${patient.id}.pdf`) para no exponer número de documento ni PII en cabeceras HTTP (`RC-023`).

3. **Adaptador `PdfmakeClinicalHistoryPdfGeneratorAdapter` con Fuentes Estándar PDF:**
   - Utiliza `PdfPrinter` de `pdfmake` configurado con la familia estándar `Helvetica` (`Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`, `Helvetica-BoldOblique`) integrada en el estándar PDF 1.3+, evitando dependencias de archivos `.ttf` externos en contenedor Docker Alpine o Jest.
   - Construye tablas limpias para datos del paciente, antecedentes, hallazgos del odontograma, plan de tratamiento y evoluciones por cita.

4. **Contrato OpenAPI y Control de Acceso (`RC-005`, `RC-070`):**
   - `GET /v1/clinical-histories/patient/:patientId/pdf`: decorado con `@Roles(UserRole.ADMIN)`, `@ApiProduces('application/pdf')` y respuesta `200 OK` con `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="historia-clinica-<patientId>.pdf"`.
   - Si un usuario con rol `AUXILIARY` invoca el endpoint, recibe `403 FORBIDDEN_ROLE`.

## Risks / Trade-offs
- **[Risk] Filtración accidental de `privateNotes` en el PDF impreso** → *Mitigación:* La interfaz `ClinicalHistoryPdfAttentionItem` en `clinical-history-pdf-generator.port.ts` ni siquiera declara la propiedad `privateNotes`, y una prueba automatizada inspecciona el contenido del PDF generado para confirmar que el texto de `privateNotes` no aparece en el documento.
- **[Risk] Fallo de carga de fuentes en `pdfmake` dentro de entornos Linux Alpine / Jest** → *Mitigación:* Configurar `PdfPrinter` con las fuentes estándar nativas del formato PDF (`Helvetica`), que no requieren lectura de fuentes en disco ni `vfs_fonts`.