# Spec Delta

## Purpose
Gestionar la historia clínica única por paciente dentro del consultorio (`clinicId`), incluyendo motivo de consulta, enfermedad actual, antecedentes médicos personales y familiares, examen clínico, diagnósticos y plan de tratamiento vinculado al catálogo de procedimientos con control de estados y costos estimados en COP.

## ADDED Requirements

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