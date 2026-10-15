# Design

## Context
Según la regla de fronteras de la Sección 3.1 del documento de Stack del Backend, `catalogs` es un módulo independiente (`Backend/src/modules/catalogs/`) separado de `patients` y `clinical` para respetar el Principio de Responsabilidad Única (SRP) y el límite de ~400 líneas por cambio (`RC-014`). Este módulo es dueño de los procedimientos odontológicos (`RF-B-050`), los precios especiales por paciente (`RF-B-051`) y los materiales propios con su stock (`RF-B-052`, `RF-B-053`), exponiendo sus casos de uso y consultas en `Backend/src/modules/catalogs/index.ts` para que `clinical` (en B-10) y `billing` (en B-17) los consuman sin acoplarse a sus capas internas (`RC-017`).

## Goals / Non-Goals

**Goals:**
- Modelar `Procedure`, `PatientProcedurePrice` y `Material` en Prisma con `clinicId` obligatorio (`RNF-B-032`) y claves foráneas con `onDelete: Restrict` (`RC-055`).
- Encapsular los importes monetarios en pesos colombianos mediante el objeto de valor `Money` (entero $\ge 0$).
- Garantizar en el dominio que todo ajuste de precio por paciente incluya un motivo no vacío (`RF-B-051`) y que ningún descuento de stock deje existencias negativas (`RF-B-053`).
- Exponer `ConsumeMaterialStockUseCase` en el `index.ts` público de `modules/catalogs` para que pueda ejecutarse dentro de `UnitOfWorkPort` al registrar materiales usados en una atención.
- Ejecutar las suites de contrato (`catalogs-repositories.contract.spec.ts`) contra `InMemory` y contra **PostgreSQL real** verificando aislamiento multitenant, `onDelete: Restrict` y traducción de `P2002` a `409 CONFLICT` (`RC-018`, `RC-050`).

**Non-Goals:**
- Control de inventario general del consultorio compartido (fuera del alcance del sistema según Sección 1.4 de Requerimientos; solo se controlan los materiales propios de la doctora).
- Registro clínico de material usado por diente dentro de una evolución (corresponde a **B-10 `add-clinical-attentions-and-materials`** en `modules/clinical`).

## Decisions

1. **Esquema Prisma con `onDelete: Restrict` e Índices de Unicidad Compuestos (`RC-055`):**
   - `Procedure` (`@@map("procedures")`): `id`, `clinicId`, `code` (normalizado en mayúsculas, ej. `"RES-EST"`), `name`, `description`, `basePriceCop` (`Int`), `isActive` (`Boolean`, default `true`), `createdAt`, `updatedAt`. Restricción `@@unique([clinicId, code])` e índice `@@index([clinicId, isActive])`. FK a `Clinic` con `onDelete: Restrict`.
   - `PatientProcedurePrice` (`@@map("patient_procedure_prices")`): `id`, `clinicId`, `patientId`, `procedureId`, `customPriceCop` (`Int`), `reason` (`String`), `createdAt`, `updatedAt`. Restricción `@@unique([clinicId, patientId, procedureId])` e índice `@@index([clinicId, patientId])`. FKs a `Clinic`, `Patient` y `Procedure` con `onDelete: Restrict`.
   - `Material` (`@@map("materials")`): `id`, `clinicId`, `brand`, `reference`, `type`, `color` (ej. `"A1"`, `"A2"`, `"BW"`), `currentStock` (`Int`), `minStock` (`Int`), `isActive` (`Boolean`, default `true`), `createdAt`, `updatedAt`. Restricción `@@unique([clinicId, brand, reference, color])` e índice `@@index([clinicId, isActive])`. FK a `Clinic` con `onDelete: Restrict`.

2. **Segregación de Puertos de Repositorio (ISP $\le 5$ métodos por puerto):**
   - `ProcedureRepositoryPort` (`PROCEDURE_REPOSITORY_PORT`): `findById`, `findByCode`, `findAllByClinicId`, `save` (4 métodos).
   - `PatientProcedurePriceRepositoryPort` (`PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT`): `findByPatientAndProcedure`, `findAllByPatient`, `save` (3 métodos).
   - `MaterialRepositoryPort` (`MATERIAL_REPOSITORY_PORT`): `findById`, `findByNaturalKey`, `findAllByClinicId`, `save` (4 métodos).

3. **Verificación de Existencia del Paciente Respetando Fronteras de Módulos (`RC-017`):**
   - `SetPatientProcedurePriceUseCase` valida que el `patientId` exista en el mismo `clinicId` inyectando `PATIENT_REPOSITORY_TOKEN` importado exclusivamente desde el `index.ts` público de `modules/patients` (`../../patients`), nunca desde sus carpetas internas.

4. **Control de Acceso por Rol (`RNF-B-004`, `RC-005`):**
   - Rutas de lectura (`GET /v1/catalogs/procedures`, `GET /v1/catalogs/patient-prices`, `GET /v1/catalogs/materials`): permitidas para `ADMIN` y `AUXILIARY`.
   - Rutas de escritura y ajuste de inventario (`POST /v1/catalogs/procedures`, `PATCH /v1/catalogs/procedures/:id`, `PUT /v1/catalogs/patient-prices`, `POST /v1/catalogs/materials`, `PATCH /v1/catalogs/materials/:id`, `POST /v1/catalogs/materials/:id/consume`): exclusivas para `ADMIN` (retornan `403 FORBIDDEN_ROLE` a `AUXILIARY`).

## Risks / Trade-offs
- **[Risk] Condiciones de carrera al crear procedimientos o materiales con el mismo código o clave natural** → *Mitigación:* Tanto `PrismaProcedureRepository.save` como `PrismaMaterialRepository.save` (y sus equivalentes `InMemory`) capturan el código `P2002` y lo traducen a `DuplicateProcedureCodeError` y `DuplicateMaterialCatalogError` (`409 CONFLICT`).
- **[Risk] Descuento de stock que deje existencias negativas** → *Mitigación:* El método de dominio `Material.consumeStock(quantity, now)` exige `quantity > 0`, `this.isActive === true` y `this.currentStock >= quantity`, lanzando `InsufficientMaterialStockError` (`422 UNPROCESSABLE_ENTITY`) si el stock disponible no alcanza.