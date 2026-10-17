# clinical-history-management Specification

## Purpose
Gestionar la historia clínica única por paciente dentro del consultorio (`clinicId`), incluyendo motivo de consulta, enfermedad actual, antecedentes médicos personales y familiares, examen clínico, diagnósticos, plan de tratamiento vinculado al catálogo de procedimientos con control de estados y costos estimados en COP y la exportación consolidada del expediente clínico en formato PDF.

## Requirements

### Requirement: Apertura y actualización de historia clínica única por paciente con antecedentes y diagnósticos
El sistema SHALL permitir exclusivamente al rol `ADMIN` crear y actualizar la historia clínica única de un paciente de su `clinicId` registrando motivo de consulta, enfermedad actual, antecedentes personales y familiares, examen clínico y diagnósticos, y SHALL permitir a `ADMIN` y `AUXILIARY` consultarla sin permitir su borrado físico (RF-B-020, RF-B-021, RF-B-022, RNF-B-004, RNF-B-012, RNF-B-032, RC-005, RC-055).

#### Scenario: Administradora abre y actualiza la historia clínica con antecedentes y auxiliar puede consultarla
- **GIVEN** un paciente activo en `"clinic-123"` sin historia clínica previa
- **WHEN** `ADMIN` envía `POST /v1/clinical-histories` con motivo de consulta, enfermedad actual, antecedentes (`allergies: true`, `allergiesDetails: "Penicilina"`), examen clínico y diagnósticos, luego la actualiza con `PATCH /v1/clinical-histories/patient/:patientId` y `AUXILIARY` consulta `GET /v1/clinical-histories/patient/:patientId`
- **THEN** la creación responde con HTTP `201`, la actualización con HTTP `200` y la consulta de `AUXILIARY` responde con HTTP `200` devolviendo la historia clínica completa

#### Scenario: Rechazo de segunda historia clínica para el mismo paciente en el consultorio
- **GIVEN** un paciente que ya posee una historia clínica registrada en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-histories` para el mismo `patientId` en `"clinic-123"`
- **THEN** la API rechaza la operación con estado HTTP `409` (`DUPLICATE_CLINICAL_HISTORY`)

#### Scenario: Rechazo cuando se marca alergia o medicación activa sin especificar el detalle
- **GIVEN** un paciente válido en `"clinic-123"`
- **WHEN** `ADMIN` intenta crear o actualizar la historia clínica con `allergies: true` y `allergiesDetails: "   "` o con `chiefComplaint` vacío
- **THEN** la API rechaza la petición con estado HTTP `400` (`INVALID_CLINICAL_HISTORY_DATA`)

#### Scenario: Bloqueo a rol AUXILIARY al intentar abrir o modificar la historia clínica o el plan de tratamiento
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `POST /v1/clinical-histories`, `PATCH /v1/clinical-histories/patient/:patientId`, `POST /v1/clinical-histories/patient/:patientId/treatment-plan-items` o `PATCH /v1/clinical-histories/patient/:patientId/treatment-plan-items/:itemId/status`
- **THEN** la API rechaza todas las peticiones de escritura con estado HTTP `403` (`FORBIDDEN_ROLE`)

### Requirement: Gestión del plan de tratamiento con procedimientos, costos y estados
El sistema SHALL permitir al rol `ADMIN` agregar procedimientos al plan de tratamiento de la historia clínica (asignando el costo personalizado del paciente o el precio estándar del procedimiento cuando no se indique un costo manual) y actualizar el estado de cada ítem entre `PENDING`, `IN_PROGRESS` y `COMPLETED` calculando el costo total estimado (RF-B-023, RNF-B-004, RNF-B-032, RC-017).

#### Scenario: Adición de ítem al plan de tratamiento resolviendo precio del catálogo y cambio de estado a COMPLETED
- **GIVEN** un paciente con historia clínica abierta y un procedimiento `"RES-EST"` en `"clinic-123"`
- **WHEN** `ADMIN` agrega el procedimiento en `POST /v1/clinical-histories/patient/:patientId/treatment-plan-items` con `toothNumber: "16"` y luego actualiza su estado en `PATCH /v1/clinical-histories/patient/:patientId/treatment-plan-items/:itemId/status` a `"COMPLETED"`
- **THEN** el ítem se crea con HTTP `201` en estado `"PENDING"` con el costo resuelto en COP, pasa a `"COMPLETED"` con HTTP `200` y `totalEstimatedCostCop` refleja la suma del plan

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

### Requirement: Versionado inmutable al actualizar la historia clínica y diagnósticos estructurados
El sistema SHALL conservar atómicamente una versión histórica inmutable (`ClinicalHistoryVersion`) cada vez que `ADMIN` actualice la historia clínica (`PATCH /v1/clinical-histories/patient/:patientId`), permitiendo a `ADMIN` y `AUXILIARY` consultar las versiones (`GET /v1/clinical-histories/patient/:patientId/versions`), y SHALL validar que los diagnósticos tengan descripción válida y que `toothNumber` en el plan de tratamiento sea un diente FDI válido (RF-B-020, RF-B-022, RF-B-023, RNF-B-012, RNF-B-013, RC-011, RC-012, RC-055).

#### Scenario: Actualización de historia clínica conserva versión inmutable previa y permite consultarla
- **GIVEN** un paciente con historia clínica abierta en `"clinic-123"` cuyo `chiefComplaint` es `"Dolor inicial"`
- **WHEN** `ADMIN` actualiza la historia en `PATCH /v1/clinical-histories/patient/:patientId` con `chiefComplaint: "Control postoperatorio"` y luego `AUXILIARY` consulta `GET /v1/clinical-histories/patient/:patientId/versions`
- **THEN** la actualización responde con HTTP `200` y el listado de versiones responde con HTTP `200` incluyendo la versión `1` con `previousData.chiefComplaint: "Dolor inicial"`

#### Scenario: Rechazo al agregar ítem al plan de tratamiento con número de diente FDI inválido
- **GIVEN** un paciente con historia clínica abierta y un procedimiento activo en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-histories/patient/:patientId/treatment-plan-items` con un `toothNumber` FDI inexistente como `"99"`
- **THEN** la API rechaza la petición con estado HTTP `400` (`INVALID_ODONTOGRAM_DATA`)

### Requirement: Rendimiento y consumo de memoria acotado al exportar PDF con 200 atenciones
El sistema SHALL generar el PDF consolidado de una historia clínica con hasta `200` atenciones registradas en menos de `2000 ms` y con un incremento de memoria heap inferior a `100 MB` para operar de forma segura dentro del límite de `512 MB` del contenedor (RF-B-030, RNF-B-030, RC-030).

#### Scenario: Generación exitosa de PDF de historia clínica para un paciente con 200 atenciones dentro del presupuesto de memoria
- **GIVEN** un expediente clínico con `200` atenciones clínicas cerradas, procedimientos y materiales usados
- **WHEN** se invoca el generador de PDF de historia clínica
- **THEN** devuelve un `Buffer` `%PDF-` válido en menos de `2000 ms` sin superar `100 MB` de incremento en `heapUsed`

