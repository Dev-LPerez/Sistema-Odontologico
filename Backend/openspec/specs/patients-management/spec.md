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

### Requirement: Búsqueda rápida de pacientes tolerante a errores tipográficos y tildes (pg_trgm + unaccent)
El sistema SHALL permitir a usuarios autenticados (`ADMIN` o `AUXILIARY`) buscar pacientes de su `clinicId` en `GET /v1/patients/search?q=...` por nombre, apellido, documento o teléfono, tolerando errores tipográficos y omisión de tildes mediante `pg_trgm` y `unaccent` en PostgreSQL, ordenando por relevancia y respondiendo en menos de 300 ms con 10.000 pacientes usando índices GIN (RF-B-012, RNF-B-004, RNF-B-031, RNF-B-032, RC-005, RC-018, RC-031).

#### Scenario: Búsqueda exitosa por nombre con errores tipográficos y sin tildes para ADMIN o AUXILIARY
- **GIVEN** pacientes activos `"Carlos Gómez"` e `"Inés Martínez"` registrados en el consultorio `"clinic-123"`
- **WHEN** un usuario autenticado con rol `ADMIN` o `AUXILIARY` consulta `GET /v1/patients/search?q=Carls Gomz` o `GET /v1/patients/search?q=Ines`
- **THEN** la API responde con estado HTTP `200` y devuelve a `"Carlos Gómez"` o `"Inés Martínez"` respectivamente ordenados por relevancia sin exponer pacientes de otros consultorios

#### Scenario: Búsqueda exitosa por fragmento de documento o teléfono con caracteres de formato
- **GIVEN** un paciente activo en `"clinic-123"` con `documentNumber: "1020304050"` y `phone: "3001234567"`
- **WHEN** un usuario autenticado consulta `GET /v1/patients/search?q=300-123` o `GET /v1/patients/search?q=102030`
- **THEN** la API responde con estado HTTP `200` e incluye al paciente coincidente en la lista de resultados

#### Scenario: Exclusión por defecto de pacientes inactivos e inclusión opcional en búsqueda
- **GIVEN** un paciente desactivado (`isActive: false`) llamado `"Laura Martínez"` en `"clinic-123"`
- **WHEN** se consulta `GET /v1/patients/search?q=Laura` sin parámetros adicionales, y luego `GET /v1/patients/search?q=Laura&includeInactive=true`
- **THEN** la primera consulta no devuelve al paciente inactivo, mientras que la segunda sí lo incluye con `isActive: false`

#### Scenario: Respuesta en menos de 300 ms sobre 10.000 pacientes reales en PostgreSQL usando índice GIN
- **GIVEN** un consultorio con `10.000` pacientes sintéticos persistidos en PostgreSQL
- **WHEN** se ejecuta la búsqueda por trigramas con un término con error tipográfico o sin tilde
- **THEN** PostgreSQL utiliza el índice GIN (`Bitmap Index Scan` en `EXPLAIN ANALYZE`) y retorna las coincidencias en menos de `300 ms` (RNF-B-031, RC-018, RC-031)

