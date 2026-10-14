# patients-management Specification

## Purpose

Gestionar el ciclo de vida lógico de los pacientes del consultorio odontológico (creación con consentimiento explícito de la Ley 1581, consulta, edición, desactivación sin borrado físico y detección de posibles duplicados por documento o teléfono) garantizando el aislamiento por `clinicId`.

## Requirements

### Requirement: Creación de paciente con autorización obligatoria de datos personales (Ley 1581)
El sistema SHALL permitir a usuarios autenticados (`ADMIN` o `AUXILIARY`) registrar un paciente en su `clinicId` con nombres, apellidos, tipo y número de documento, fecha de nacimiento, teléfono, correo, dirección, contacto de emergencia, fuente de captación y autorización explícita de tratamiento de datos (`dataTreatmentConsent: true`), rechazando registros sin consentimiento o con documento duplicado en el mismo consultorio (RF-B-010, RF-B-011, RF-B-014, RNF-B-010, RNF-B-011, RNF-B-032).

#### Scenario: Registro exitoso de paciente con consentimiento Ley 1581 por doctora o auxiliar
- **GIVEN** un usuario autenticado con rol `ADMIN` o `AUXILIARY` en el consultorio `"clinic-123"`
- **WHEN** envía `POST /v1/patients` con datos demográficos válidos, `acquisitionSource: "INSTAGRAM"` y `dataTreatmentConsent: true`
- **THEN** la API responde con estado HTTP `201` y devuelve el paciente creado con `isActive: true`, `clinicId: "clinic-123"` y `dataTreatmentConsentAt` con la marca de tiempo UTC actual

#### Scenario: Rechazo de creación de paciente cuando no se otorga el consentimiento Ley 1581
- **GIVEN** una petición `POST /v1/patients` donde `dataTreatmentConsent` es `false`
- **WHEN** el sistema procesa el registro del paciente
- **THEN** la API rechaza la operación con estado HTTP `422` (`DATA_TREATMENT_CONSENT_REQUIRED`)

#### Scenario: Rechazo por documento de identidad duplicado en el mismo consultorio
- **GIVEN** un paciente ya registrado en `"clinic-123"` con `documentType: "CC"` y `documentNumber: "1020304050"`
- **WHEN** se envía `POST /v1/patients` en `"clinic-123"` con el mismo tipo y número de documento
- **THEN** la API responde con estado HTTP `409` (`DUPLICATE_PATIENT_DOCUMENT`)

### Requirement: Detección de posibles pacientes duplicados por documento o teléfono
El sistema SHALL permitir a `ADMIN` y `AUXILIARY` verificar posibles duplicados dentro de su `clinicId` buscando coincidencias por `documentNumber` o `phone` (con soporte de `excludePatientId` al editar), e incluir las coincidencias detectadas para advertir al usuario sin bloquear teléfonos compartidos por familiares (RF-B-013, RC-005).

#### Scenario: Detección de posible duplicado por número de documento o teléfono
- **GIVEN** un paciente registrado en `"clinic-123"` con `documentNumber: "1020304050"` y `phone: "3001234567"`
- **WHEN** un usuario autenticado consulta `GET /v1/patients/check-duplicates?phone=3001234567`
- **THEN** la API responde con estado HTTP `200` y la lista de pacientes coincidentes del mismo consultorio indicando el motivo de coincidencia (`DOCUMENT` o `PHONE`)

### Requirement: Consulta, listado y edición de datos básicos de pacientes
El sistema SHALL permitir a `ADMIN` y `AUXILIARY` listar los pacientes de su consultorio (con filtro opcional `isActive`), consultar el detalle de un paciente por `id` y actualizar sus datos demográficos, contacto de emergencia y fuente de captación (RF-B-010, RF-B-011, RF-B-014, RNF-B-032).

#### Scenario: Actualización exitosa de datos de contacto y emergencia de un paciente
- **GIVEN** un paciente existente en `"clinic-123"`
- **WHEN** un usuario `ADMIN` o `AUXILIARY` envía `PATCH /v1/patients/:id` con nueva dirección, teléfono y contacto de emergencia
- **THEN** la API actualiza el registro y responde con estado HTTP `200` y los datos actualizados

### Requirement: Desactivación lógica de pacientes sin eliminación física exclusiva para ADMIN
El sistema SHALL conservar permanentemente los registros de pacientes sin exponer borrado físico y SHALL permitir únicamente al rol `ADMIN` activar o desactivar un paciente en `PATCH /v1/patients/:id/status` (RF-B-010, RNF-B-004, RNF-B-012, RC-005, RC-055).

#### Scenario: Administradora desactiva lógicamente a un paciente
- **GIVEN** un paciente activo en `"clinic-123"` y una usuaria con rol `ADMIN`
- **WHEN** envía `PATCH /v1/patients/:id/status` con `{ "isActive": false }`
- **THEN** la API responde con HTTP `200` y el paciente queda con `isActive: false` sin ser eliminado de la base de datos

#### Scenario: Bloqueo a rol AUXILIARY al intentar desactivar un paciente
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `PATCH /v1/patients/:id/status` con `{ "isActive": false }`
- **THEN** la API rechaza la petición con estado HTTP `403` (`FORBIDDEN_ROLE`)
