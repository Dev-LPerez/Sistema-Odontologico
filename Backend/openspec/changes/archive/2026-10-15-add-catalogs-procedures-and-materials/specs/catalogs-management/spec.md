# Spec Delta

## Purpose
Gestionar el catálogo de procedimientos odontológicos con precios estándar, los ajustes de precio por paciente con motivo obligatorio, y el catálogo de materiales propios de la doctora (marca, referencia, tipo y color) con control de existencias, descuento de stock y alerta de bajo inventario por consultorio (`clinicId`).

## ADDED Requirements

### Requirement: Gestión del catálogo de procedimientos odontológicos con precio estándar
El sistema SHALL permitir al rol `ADMIN` crear y actualizar procedimientos en su `clinicId` con código único, nombre, descripción opcional, precio estándar en COP ($\ge 0$) y estado `isActive`, y SHALL permitir a `ADMIN` y `AUXILIARY` listar los procedimientos del consultorio (RF-B-050, RNF-B-004, RNF-B-032, RC-005).

#### Scenario: Administradora crea y actualiza un procedimiento y auxiliar puede listarlo
- **GIVEN** una usuaria autenticada con rol `ADMIN` y una auxiliar con rol `AUXILIARY` en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/catalogs/procedures` con `code: "RES-EST"`, `name: "Resina estética"`, `basePriceCop: 180000` y luego `AUXILIARY` consulta `GET /v1/catalogs/procedures`
- **THEN** la creación responde con HTTP `201` y la consulta de `AUXILIARY` responde con HTTP `200` devolviendo el procedimiento dentro de `"clinic-123"`

#### Scenario: Rechazo de procedimiento con código duplicado en el mismo consultorio
- **GIVEN** un procedimiento registrado en `"clinic-123"` con `code: "LIM-GEN"`
- **WHEN** `ADMIN` envía `POST /v1/catalogs/procedures` en `"clinic-123"` con el mismo código `"LIM-GEN"`
- **THEN** la API responde con estado HTTP `409` (`DUPLICATE_PROCEDURE_CODE`)

#### Scenario: Bloqueo a rol AUXILIARY al intentar crear o modificar procedimientos o materiales
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `POST /v1/catalogs/procedures`, `PATCH /v1/catalogs/procedures/:id`, `PUT /v1/catalogs/patient-prices` o `POST /v1/catalogs/materials`
- **THEN** la API rechaza la petición con estado HTTP `403` (`FORBIDDEN_ROLE`)

### Requirement: Ajuste de precio de procedimiento por paciente con motivo obligatorio
El sistema SHALL permitir al rol `ADMIN` configurar un precio personalizado en COP ($\ge 0$) para un paciente y procedimiento de su `clinicId` exigiendo un motivo no vacío (familiar, conocido, promoción), y SHALL permitir a `ADMIN` y `AUXILIARY` consultar los precios especiales del paciente (RF-B-051, RNF-B-004, RNF-B-032).

#### Scenario: Configuración y consulta exitosa de precio especial por paciente con motivo
- **GIVEN** un paciente activo y un procedimiento con `basePriceCop: 180000` en `"clinic-123"`
- **WHEN** `ADMIN` envía `PUT /v1/catalogs/patient-prices` con `patientId`, `procedureId`, `customPriceCop: 140000` y `reason: "Tarifa familiar"`
- **THEN** la API responde con HTTP `200` y al consultar `GET /v1/catalogs/patient-prices?patientId=...` devuelve el precio personalizado con su `reason`

#### Scenario: Rechazo de ajuste de precio por paciente cuando el motivo está vacío
- **GIVEN** un paciente y un procedimiento válidos en `"clinic-123"`
- **WHEN** `ADMIN` intenta registrar un precio por paciente con `reason: "   "` o precio negativo
- **THEN** la API rechaza la operación con estado HTTP `400` (`PATIENT_PRICE_REASON_REQUIRED` o `INVALID_MONEY_AMOUNT`)

### Requirement: Catálogo de materiales propios con control de existencias y alerta de bajo stock
El sistema SHALL permitir al rol `ADMIN` registrar y actualizar materiales propios (marca, referencia, tipo, color como `A1`, `A2`, `BW`, `currentStock` y `minStock`) y descontar existencias al registrar su uso, calculando `isLowStock: true` cuando `currentStock <= minStock` e impidiendo saldos negativos (RF-B-052, RF-B-053, RNF-B-032, RC-005).

#### Scenario: Registro de material propio y activación de alerta de bajo stock tras descuento
- **GIVEN** un material creado por `ADMIN` en `"clinic-123"` con `brand: "3M"`, `reference: "Filtek Z350"`, `type: "RESIN"`, `color: "A2"`, `currentStock: 3` y `minStock: 2` (`isLowStock: false`)
- **WHEN** se descuentan `2` unidades mediante `POST /v1/catalogs/materials/:id/consume` con `{ "quantity": 2 }`
- **THEN** la API responde con HTTP `200`, `currentStock` queda en `1` y `isLowStock` pasa a `true`

#### Scenario: Rechazo de descuento de material cuando las existencias son insuficientes
- **GIVEN** un material propio en `"clinic-123"` con `currentStock: 1`
- **WHEN** se intenta descontar `{ "quantity": 2 }` en `POST /v1/catalogs/materials/:id/consume`
- **THEN** la API rechaza la operación con estado HTTP `422` (`INSUFFICIENT_MATERIAL_STOCK`) sin modificar el stock actual