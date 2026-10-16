# Spec Delta

## Purpose
Gestionar el odontograma estructurado (`JSONB`) único por paciente dentro del consultorio (`clinicId`), soportando las 32 piezas permanentes y las 20 piezas de dentición temporal bajo nomenclatura FDI, almacenando hallazgos estandarizados por superficie y estado (`EXISTING`, `PLANNED`, `PERFORMED`), y conservando instantáneas históricas inmutables por fecha para comparar la evolución clínica.

## ADDED Requirements

### Requirement: Registro y consulta del odontograma estructurado por diente y superficie
El sistema SHALL permitir al rol `ADMIN` registrar y actualizar el odontograma estructurado de un paciente de su `clinicId` con soporte para las 32 piezas permanentes y 20 temporales, almacenando hallazgos del catálogo estandarizado por superficie (`OCCLUSAL`, `VESTIBULAR`, `LINGUAL`, `MESIAL`, `DISTAL`, `WHOLE_TOOTH`) y estado (`EXISTING`, `PLANNED`, `PERFORMED`), y SHALL permitir a `ADMIN` y `AUXILIARY` consultarlo (RF-B-040, RF-B-041, RF-B-042, RF-B-044, RNF-B-004, RNF-B-032, RC-005).

#### Scenario: Administradora actualiza hallazgos en dientes permanentes y temporales y auxiliar consulta el odontograma
- **GIVEN** un paciente activo en `"clinic-123"`
- **WHEN** `ADMIN` envía `PUT /v1/odontograms/patient/:patientId` con `hasTemporalDentition: true` y hallazgos en la pieza permanente `"16"` (`surface: "OCCLUSAL"`, `findingCode: "CARIES"`, `status: "EXISTING"`) y en la pieza temporal `"55"` (`surface: "VESTIBULAR"`, `findingCode: "RESIN_RESTORATION"`, `status: "PERFORMED"`), y luego `AUXILIARY` consulta `GET /v1/odontograms/patient/:patientId`
- **THEN** la actualización responde con HTTP `200` y la consulta de `AUXILIARY` responde con HTTP `200` devolviendo el odontograma estructurado con ambos hallazgos

#### Scenario: Rechazo por número de diente FDI inválido, superficie incompatible o código de hallazgo desconocido
- **GIVEN** un paciente activo en `"clinic-123"`
- **WHEN** `ADMIN` envía `PUT /v1/odontograms/patient/:patientId` con un número de diente FDI inexistente como `"19"` o `"99"`, o con un `findingCode` fuera del catálogo estandarizado
- **THEN** la API rechaza la petición con estado HTTP `400` (`INVALID_ODONTOGRAM_DATA`)

#### Scenario: Bloqueo a rol AUXILIARY al intentar modificar el odontograma o crear una instantánea
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `PUT /v1/odontograms/patient/:patientId` o `POST /v1/odontograms/patient/:patientId/snapshots`
- **THEN** la API rechaza ambas peticiones de escritura con estado HTTP `403` (`FORBIDDEN_ROLE`)

### Requirement: Captura y consulta de instantáneas históricas inmutables del odontograma por fecha
El sistema SHALL permitir al rol `ADMIN` guardar instantáneas inmutables del estado actual del odontograma de un paciente con fecha UTC y nota opcional, y SHALL permitir a `ADMIN` y `AUXILIARY` listar las instantáneas históricas del paciente sin que cambios posteriores al odontograma alteren las instantáneas ya guardadas (RF-B-043, RF-B-044, RNF-B-004, RNF-B-012, RC-005, RC-055).

#### Scenario: Creación de instantánea del odontograma y preservación inmutable tras cambios posteriores
- **GIVEN** un paciente en `"clinic-123"` cuyo odontograma tiene en el diente `"16"` el hallazgo `"CARIES"` en estado `"EXISTING"`
- **WHEN** `ADMIN` crea una instantánea en `POST /v1/odontograms/patient/:patientId/snapshots`, luego actualiza el diente `"16"` a `"RESIN_RESTORATION"` (`"PERFORMED"`) en `PUT /v1/odontograms/patient/:patientId`, y consulta `GET /v1/odontograms/patient/:patientId/snapshots`
- **THEN** la creación de la instantánea responde con HTTP `201` y el listado responde con HTTP `200` conservando en la instantánea original el estado `"CARIES"` (`"EXISTING"`) sin alteraciones