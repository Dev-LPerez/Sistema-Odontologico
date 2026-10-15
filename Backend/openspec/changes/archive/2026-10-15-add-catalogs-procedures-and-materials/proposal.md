# Proposal

## Why
Con el módulo `patients` completado y archivado, el consultorio necesita el módulo independiente `modules/catalogs` antes de construir la historia clínica (`clinical`) y las cotizaciones (`billing`). La Dra. Angelee Pacheco requiere mantener su catálogo de procedimientos odontológicos con precios estándar en pesos colombianos (COP), asignar tarifas especiales por paciente registrando el motivo (familiar, conocido, promoción), y gestionar su catálogo de materiales propios (resinas y materiales de diseño de sonrisa con marca, referencia, tipo y color como `A1`, `A2`, `BW`) con control de existencias, descuento de stock y alerta de bajo inventario.

- **Requisitos cubiertos:** RF-B-050, RF-B-051, RF-B-052, RF-B-053, RNF-B-004, RNF-B-032, RC-001, RC-002, RC-003, RC-005, RC-012, RC-015, RC-016, RC-017, RC-018, RC-050, RC-055, RC-070, RC-074.
- **Change equivalente en Frontend:** `add-patients-and-catalogs-ui`.

## What Changes
- Agregar en `Backend/prisma/schema.prisma` los modelos `Procedure`, `PatientProcedurePrice` y `Material` vinculados a `clinicId` con restricción `onDelete: Restrict` (`RC-055`).
- Implementar la capa `domain` en `Backend/src/modules/catalogs/domain/`: objeto de valor `Money` (COP entero $\ge 0$), agregados `Procedure`, `PatientProcedurePrice` y `Material` (con cálculo `isLowStock` y método `consumeStock`), errores de dominio tipados y puertos segregados (`ProcedureRepositoryPort`, `PatientProcedurePriceRepositoryPort`, `MaterialRepositoryPort`).
- Implementar la capa `application`: casos de uso y consultas con un único método `execute` (`CreateProcedureUseCase`, `UpdateProcedureUseCase`, `ListProceduresQuery`, `SetPatientProcedurePriceUseCase`, `ListPatientProcedurePricesQuery`, `CreateMaterialUseCase`, `UpdateMaterialUseCase`, `ConsumeMaterialStockUseCase`, `ListMaterialsQuery`).
- Implementar la capa `infrastructure`: mapeadores y repositorios `InMemory` y `Prisma` con traducción de colisiones `P2002` a errores de dominio `409 CONFLICT` y suite de pruebas de contrato contra PostgreSQL real (`RC-018`, `RC-050`).
- Implementar la capa `presentation`: `CatalogsController` (`/v1/catalogs/...`), pruebas de permisos por rol (`ADMIN` vs `AUXILIARY`, `RC-005`), API pública en `index.ts` para `modules/clinical` y actualización de `Backend/openapi.json`.

## Capabilities

### New Capabilities
- `catalogs-management`: Gestión del catálogo de procedimientos odontológicos, precios ajustados por paciente con motivo obligatorio, y catálogo de materiales propios con control de existencias, descuento de stock y alerta de bajo inventario.

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/prisma/migrations/`, `Backend/src/modules/catalogs/`, `Backend/src/app.module.ts`, `Backend/jest.config.ts`, `Backend/test/catalogs.e2e-spec.ts`, `Backend/openapi.json`.