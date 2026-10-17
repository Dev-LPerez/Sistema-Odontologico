# clinical-attentions-management Specification

## Purpose
Gestionar el ciclo de vida completo de las atenciones clínicas del paciente dentro de su `clinicId`, incluyendo su creación y edición en estado abierto, el consumo atómico de materiales propios usados por diente, el cierre formal validado cuando los datos obligatorios están completos y el versionado histórico inmutable ante enmiendas posteriores al cierre con protección de notas privadas por rol.

## Requirements

### Requirement: Registro, actualización y consulta de atenciones clínicas con protección de notas privadas
El sistema SHALL permitir exclusivamente al rol `ADMIN` crear y actualizar atenciones clínicas abiertas (`OPEN`) de un paciente de su `clinicId` con evolución, prescripción, indicaciones y notas privadas confidenciales (`privateNotes`), y SHALL permitir a `ADMIN` y `AUXILIARY` consultar las atenciones ocultando siempre `privateNotes` (`null`) para el rol `AUXILIARY` (RF-B-024, RF-B-025, RF-B-027, RNF-B-004, RNF-B-009, RNF-B-012, RNF-B-032, RC-005, RC-055).

#### Scenario: Administradora registra y actualiza una atención clínica con notas privadas y auxiliar la consulta sin ver las notas privadas
- **GIVEN** un paciente con historia clínica abierta en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions` con `evolutionNotes`, `prescription`, `postOperativeIndications` y `privateNotes: "Paciente ansioso, cobrar saldo pendiente"`, luego la actualiza con `PATCH /v1/clinical-attentions/:id` y posteriormente `ADMIN` y `AUXILIARY` consultan `GET /v1/clinical-attentions/patient/:patientId`
- **THEN** la creación responde con HTTP `201`, la actualización con HTTP `200`, la consulta de `ADMIN` devuelve `privateNotes` íntegro y la consulta de `AUXILIARY` responde con HTTP `200` devolviendo `privateNotes: null`

#### Scenario: Rechazo cuando se intenta crear o actualizar una atención con evolución vacía o paciente sin historia clínica
- **GIVEN** un paciente en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions` con `evolutionNotes: "   "` o para un paciente sin historia clínica abierta
- **THEN** la API rechaza la operación con estado HTTP `400` (`INVALID_CLINICAL_ATTENTION_DATA`) o `404` (`CLINICAL_HISTORY_NOT_FOUND`)

#### Scenario: Bloqueo a rol AUXILIARY al intentar crear, editar o registrar materiales en una atención clínica
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `POST /v1/clinical-attentions`, `PATCH /v1/clinical-attentions/:id` o `POST /v1/clinical-attentions/:id/materials`
- **THEN** la API rechaza todas las peticiones de escritura con estado HTTP `403` (`FORBIDDEN_ROLE`)

### Requirement: Registro transaccional de materiales propios usados por diente con descuento automático de stock
El sistema SHALL permitir al rol `ADMIN` registrar en una atención abierta los materiales propios utilizados (indicando `materialId`, `quantity` $> 0$ y `toothNumber` FDI opcional), descontando atómicamente las existencias del catálogo y revirtiendo la operación si el stock es insuficiente o el diente FDI es inválido (RF-B-026, RF-B-053, RNF-B-032, RC-012, RC-017).

#### Scenario: Registro exitoso de material usado por diente en una atención y descuento atómico de existencias
- **GIVEN** una atención clínica en estado `"OPEN"` y un material propio `"Filtek Z350"` color `"A2"` con `currentStock: 4` y `minStock: 2` en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions/:id/materials` con `materialId`, `quantity: 2`, `toothNumber: "16"` y `notes: "Restauración oclusal"`
- **THEN** la API responde con HTTP `201` registrando el material con su marca, referencia, tipo, color `"A2"` y diente `"16"`, y el material en el catálogo queda con `currentStock: 2` e `isLowStock: true`

#### Scenario: Reversión atómica cuando el stock del material propio es insuficiente al registrarlo en la atención
- **GIVEN** una atención clínica en estado `"OPEN"` y un material propio con `currentStock: 1` en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions/:id/materials` solicitando `quantity: 3`
- **THEN** la API rechaza la operación con estado HTTP `422` (`INSUFFICIENT_MATERIAL_STOCK`), el stock del material permanece en `1` y no se agrega ningún registro de material a la atención

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

### Requirement: Validación de diente FDI, superficie y existencia en catálogo de procedimientos realizados en la atención
El sistema SHALL validar al crear, actualizar o enmendar una atención clínica que todo elemento de `proceduresPerformed` corresponda a un código de procedimiento existente en el catálogo del consultorio (`404 PROCEDURE_NOT_FOUND` si no existe) y que sus campos opcionales `toothNumber` y `surface` cumplan la nomenclatura FDI y el catálogo de superficies (`400` si son inválidos), ejecutando el cierre y la publicación de `AttentionClosedEvent` dentro de `UnitOfWorkPort` (RF-B-024, RF-B-028, RF-B-029, RF-B-050, RC-012, RC-017).

#### Scenario: Rechazo al registrar o actualizar una atención con código de procedimiento inexistente, diente FDI inválido o superficie inválida
- **GIVEN** un paciente con historia clínica abierta en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/clinical-attentions` con un procedimiento cuyo `code` no existe en el catálogo, o con `toothNumber: "99"`, o con `surface: "SUPERFICIE_FALSA"`
- **THEN** la API rechaza la petición con estado HTTP `404` (`PROCEDURE_NOT_FOUND`) o `400` (`INVALID_ODONTOGRAM_DATA` / `INVALID_CLINICAL_ATTENTION_DATA`) respectivamente

#### Scenario: Reversión transaccional del cierre de atención si falla la publicación del evento AttentionClosedEvent
- **GIVEN** una atención clínica abierta con procedimientos válidos en `"clinic-123"`
- **WHEN** ocurre un fallo en un manejador durante la publicación de `AttentionClosedEvent` dentro de `CloseClinicalAttentionUseCase`
- **THEN** la transacción de `UnitOfWorkPort` se revierte y la atención no queda persistida como `CLOSED` sin haber notificado el evento

