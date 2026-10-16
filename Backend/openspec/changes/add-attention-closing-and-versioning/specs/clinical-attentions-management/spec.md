# Spec Delta

## Purpose
Gestionar el ciclo de vida completo de las atenciones clínicas del paciente dentro de su `clinicId`, incluyendo su creación y edición en estado abierto, el consumo atómico de materiales propios, el cierre validado cuando la información obligatoria está completa y el versionado histórico inmutable ante cualquier edición posterior al cierre protegiendo las notas privadas por rol.

## ADDED Requirements

### Requirement: Cierre formal de atención clínica validando datos obligatorios e inmutabilidad ordinaria
El sistema SHALL permitir exclusivamente al rol `ADMIN` cerrar una atención clínica abierta (`POST /v1/clinical-attentions/:id/close`) solo cuando tenga al menos un procedimiento realizado en `proceduresPerformed` y `evolutionNotes` no vacío, pasando su estado a `CLOSED` y rechazando ediciones ordinarias o adición de materiales posteriores al cierre (RF-B-028, RF-B-029, RNF-B-004, RNF-B-012, RC-005).

#### Scenario: Cierre exitoso de atención clínica completa y bloqueo de edición ordinaria posterior
- **GIVEN** una atención clínica en estado `"OPEN"` en `"clinic-123"` con `proceduresPerformed: [{ code: "RES-01", toothNumber: "16" }]` y `evolutionNotes` registrado
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions/:id/close` y luego intenta modificarla mediante `PATCH /v1/clinical-attentions/:id`
- **THEN** el cierre responde con HTTP `200` cambiando `status` a `"CLOSED"` y el intento de edición ordinaria posterior es rechazado con HTTP `422` (`CLINICAL_ATTENTION_CLOSED`)

#### Scenario: Rechazo de cierre de atención clínica cuando no tiene procedimientos realizados
- **GIVEN** una atención clínica en estado `"OPEN"` en `"clinic-123"` cuyo arreglo `proceduresPerformed` está vacío (`[]`)
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions/:id/close`
- **THEN** la API rechaza el cierre con estado HTTP `422` (`INCOMPLETE_CLINICAL_ATTENTION`) y la atención permanece en estado `"OPEN"`

### Requirement: Enmienda de atención clínica cerrada con preservación de versión histórica inmutable
El sistema SHALL permitir exclusivamente al rol `ADMIN` enmendar una atención clínica en estado `CLOSED` (`POST /v1/clinical-attentions/:id/amend`) exigiendo un motivo no vacío (`changeReason`), conservando atómicamente una versión inmutable del estado anterior con fecha y usuario autor, y SHALL permitir a `ADMIN` y `AUXILIARY` consultar las versiones (`GET /v1/clinical-attentions/:id/versions`) ocultando `previousData.privateNotes` (`null`) para `AUXILIARY` (RF-B-027, RF-B-030, RNF-B-004, RNF-B-012, RC-005, RC-055).

#### Scenario: Enmienda de atención cerrada conserva versión inmutable previa y oculta notas privadas históricas al rol AUXILIARY
- **GIVEN** una atención clínica en estado `"CLOSED"` en `"clinic-123"` con `evolutionNotes: "Evolución original"` y `privateNotes: "Nota privada original"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions/:id/amend` con `changeReason: "Aclaración de concentración anestésica"`, `evolutionNotes: "Evolución corregida"` y `privateNotes: "Nota privada actualizada"`, y luego `ADMIN` y `AUXILIARY` consultan `GET /v1/clinical-attentions/:id/versions`
- **THEN** la enmienda responde con HTTP `200`, la consulta de versiones de `ADMIN` devuelve la versión `1` con `previousData.evolutionNotes: "Evolución original"` y `previousData.privateNotes: "Nota privada original"`, y la consulta de `AUXILIARY` devuelve la versión `1` con `previousData.privateNotes: null`

#### Scenario: Rechazo de enmienda cuando el motivo está vacío o la atención aún está abierta
- **GIVEN** una atención clínica en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions/:id/amend` con `changeReason: "   "` sobre una atención cerrada, o intenta enmendar una atención que aún está en estado `"OPEN"`
- **THEN** la API rechaza la operación con estado HTTP `400` (`INVALID_CLINICAL_ATTENTION_DATA`) o `422` (`CLINICAL_ATTENTION_NOT_CLOSED`) respectivamente

#### Scenario: Bloqueo a rol AUXILIARY al intentar cerrar o enmendar una atención clínica
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `POST /v1/clinical-attentions/:id/close` o `POST /v1/clinical-attentions/:id/amend`
- **THEN** la API rechaza ambas peticiones con estado HTTP `403` (`FORBIDDEN_ROLE`)