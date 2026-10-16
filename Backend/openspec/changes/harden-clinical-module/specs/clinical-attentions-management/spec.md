# Spec Delta

## ADDED Requirements

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