# Spec Delta

## ADDED Requirements

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