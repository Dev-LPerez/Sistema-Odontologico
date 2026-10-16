# Spec Delta

## ADDED Requirements

### Requirement: Descuento atómico de existencias ante peticiones concurrentes y validación de UUID en rutas de catálogos
El sistema SHALL descontar las existencias de materiales propios de forma atómica en la base de datos impidiendo la pérdida de actualizaciones (*Lost Update*) o saldos negativos bajo peticiones simultáneas, y SHALL validar con `ParseUUIDPipe` los parámetros `:id` en las rutas de procedimientos y materiales devolviendo `400` ante identificadores malformados (RF-B-053, RNF-B-005, RC-018).

#### Scenario: Descuento atómico exacto bajo consumos concurrentes sobre el mismo material propio
- **GIVEN** un material propio en `"clinic-123"` con `currentStock: 5`
- **WHEN** se ejecutan dos descuentos concurrentes de `3` unidades cada uno sobre el mismo material
- **THEN** el primero descuenta dejando `currentStock: 2` y el segundo es rechazado con `422` (`INSUFFICIENT_MATERIAL_STOCK`) sin perder actualizaciones ni dejar stock negativo