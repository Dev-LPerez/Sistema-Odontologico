# clinical-attentions-management Specification

## Purpose
Gestionar el registro y actualización de atenciones clínicas (evoluciones por visita) vinculadas a la historia clínica del paciente dentro de su `clinicId`, incluyendo procedimientos realizados, prescripción médica, indicaciones postoperatorias, notas privadas confidenciales exclusivas de la administradora y el registro transaccional de materiales propios usados por diente con descuento automático de existencias.

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
