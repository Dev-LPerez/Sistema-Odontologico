# Spec Delta

## Purpose
Gestionar la historia clínica única por paciente dentro del consultorio (`clinicId`), incluyendo motivo de consulta, enfermedad actual, antecedentes médicos personales y familiares, examen clínico, diagnósticos, plan de tratamiento vinculado al catálogo de procedimientos y la exportación consolidada del expediente clínico en formato PDF.

## ADDED Requirements

### Requirement: Exportación de historia clínica completa en PDF con membrete y exclusión de notas privadas
El sistema SHALL permitir exclusivamente al rol `ADMIN` exportar en formato PDF (`GET /v1/clinical-histories/patient/:patientId/pdf`) la historia clínica completa de un paciente de su `clinicId`, incluyendo los datos del consultorio, datos del paciente, antecedentes médicos, odontograma actual, plan de tratamiento y atenciones clínicas registradas, omitiendo siempre las notas privadas confidenciales (`privateNotes`) (RF-B-027, RF-B-031, RNF-B-004, RNF-B-009, RNF-B-032, RC-005, RC-023, RC-054).

#### Scenario: Exportación exitosa de historia clínica completa en PDF por rol ADMIN excluyendo notas privadas
- **GIVEN** un paciente activo con historia clínica abierta, odontograma y una atención clínica que contiene `evolutionNotes: "Obturación oclusal en diente 16"` y `privateNotes: "Nota confidencial secreta de la doctora"` en `"clinic-123"`
- **WHEN** `ADMIN` envía `GET /v1/clinical-histories/patient/:patientId/pdf`
- **THEN** la API responde con estado HTTP `200`, cabecera `Content-Type: application/pdf`, `Content-Disposition` con nombre de archivo `.pdf`, un cuerpo binario que inicia con `%PDF-` e incluye los datos clínicos públicos sin contener en ningún lugar el texto de `privateNotes`

#### Scenario: Rechazo de exportación a PDF cuando el paciente no tiene historia clínica abierta
- **GIVEN** un paciente registrado en `"clinic-123"` que aún no posee historia clínica abierta
- **WHEN** `ADMIN` envía `GET /v1/clinical-histories/patient/:patientId/pdf`
- **THEN** la API rechaza la petición con estado HTTP `404` (`CLINICAL_HISTORY_NOT_FOUND`)

#### Scenario: Bloqueo a rol AUXILIARY al intentar exportar la historia clínica en PDF
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `GET /v1/clinical-histories/patient/:patientId/pdf`
- **THEN** la API rechaza la petición con estado HTTP `403` (`FORBIDDEN_ROLE`)