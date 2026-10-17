# Spec Delta

## ADDED Requirements

### Requirement: Control de concurrencia optimista al actualizar el odontograma
El sistema SHALL validar el campo opcional `expectedUpdatedAt` al actualizar el odontograma de un paciente (`PUT /v1/odontograms/patient/:patientId`), rechazando la operación con estado HTTP `409` (`ODONTOGRAM_CONFLICT`) cuando el odontograma haya sido modificado por otra sesión desde esa marca de tiempo, evitando sobrescrituras silenciosas (RF-B-040, RNF-F-033, RC-055).

#### Scenario: Rechazo por conflicto de concurrencia optimista cuando expectedUpdatedAt no coincide con la versión actual
- **GIVEN** un odontograma registrado en `"clinic-123"` cuya última actualización fue en `T1` y posteriormente otra sesión lo actualizó en `T2`
- **WHEN** `ADMIN` envía `PUT /v1/odontograms/patient/:patientId` incluyendo `expectedUpdatedAt: T1`
- **THEN** la API rechaza la sobrescritura con estado HTTP `409` (`ODONTOGRAM_CONFLICT`) conservando intactos los hallazgos guardados en `T2`