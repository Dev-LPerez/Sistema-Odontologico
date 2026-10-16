# Design

## Context
En **B-08** y **B-09** establecimos la historia clínica única del paciente (`ClinicalHistory`) y su odontograma estructurado (`Odontogram`). En **B-10 (`add-clinical-attentions-and-materials`)** implementamos el registro de atenciones clínicas (`ClinicalAttention`) con evoluciones, prescripciones, notas privadas confidenciales de la doctora y el registro de materiales propios utilizados por diente descontando existencias en una única transacción atómica (`UnitOfWorkPort`). El cierre inmutable y el historial de versiones de atenciones cerradas se abordarán en **B-11 (`add-attention-closing-and-versioning`)** para respetar el límite de ~400 líneas (`RC-014`).

- **Módulo y capas afectadas:** `modules/clinical` (`domain`, `application`, `infrastructure`, `presentation`) y `shared/infrastructure` (`logger` y `sentry`).
- **Puertos nuevos:** `ClinicalAttentionRepositoryPort` (`CLINICAL_ATTENTION_REPOSITORY_PORT`).
- **Eventos de dominio:** Ninguno nuevo en este change (el descuento de stock en `catalogs` se ejecuta sincrónicamente dentro de `UnitOfWorkPort`).
- **ADR:** No requiere un nuevo ADR; aplica la propagación transaccional con `AsyncLocalStorage` y las reglas de frontera definidas en `ADR-0001`.

## Goals / Non-Goals

**Goals:**
- Permitir al rol `ADMIN` crear y editar atenciones clínicas en estado `OPEN` asociadas a la historia clínica del paciente (`RF-B-024`, `RF-B-025`).
- Garantizar la confidencialidad estricta de `privateNotes` (`RF-B-027`, `RNF-B-004`, `RC-005`): solo `ADMIN` puede registrar y leer `privateNotes`; cuando `AUXILIARY` consulta una atención o el listado de atenciones, el servidor devuelve `privateNotes: null`.
- Registrar materiales propios utilizados en la atención (copiando instantánea de `brand`, `reference`, `type`, `color`, `toothNumber` FDI opcional y `quantity`) y descontar su stock en `modules/catalogs` mediante `ConsumeMaterialStockUseCase` dentro de `UnitOfWorkPort` (`RF-B-026`, `RF-B-053`, `RC-017`).
- Proteger todas las relaciones con `onDelete: Restrict` (`RC-055`) y redactar los nuevos campos clínicos en Pino y Sentry (`RC-023`).

**Non-Goals:**
- Cierre definitivo de la atención (`CLOSED`) y versionado inmutable ante ediciones posteriores al cierre (corresponde a **B-11 `add-attention-closing-and-versioning`**).
- Adjuntar archivos o fotografías clínicas en Cloudflare R2 (corresponde a **B-15 `add-clinical-files-and-photos`**).

## Decisions

1. **Esquema Prisma con `onDelete: Restrict` (`RC-055`):**
   - `ClinicalAttentionStatus`: enum `{ OPEN CLOSED }`.
   - `ClinicalAttention` (`@@map("clinical_attentions")`): `id`, `clinicId`, `patientId`, `clinicalHistoryId`, `attendedByUserId`, `status` (`ClinicalAttentionStatus`, default `OPEN`), `proceduresPerformed` (`Json`), `evolutionNotes` (`String`), `prescription` (`String?`), `postOperativeIndications` (`String?`), `privateNotes` (`String?`), `attendedAt` (`DateTime`), `createdAt`, `updatedAt`. Índices `@@index([clinicId, patientId, attendedAt])` y `@@index([clinicId, clinicalHistoryId])`. FKs a `Clinic`, `Patient`, `ClinicalHistory` y `User` con `onDelete: Restrict`.
   - `AttentionMaterialUsed` (`@@map("attention_materials_used")`): `id`, `clinicId`, `attentionId`, `materialId`, `brand`, `reference`, `type`, `color`, `toothNumber` (`String?`), `quantity` (`Int`), `notes` (`String?`), `createdAt`. Índices `@@index([clinicId, attentionId])` y `@@index([clinicId, materialId])`. FKs a `Clinic`, `ClinicalAttention` y `Material` con `onDelete: Restrict`.

2. **Agregado `ClinicalAttention` y Entidad Hija `AttentionMaterialUsed` (`RC-012`, `RC-016`):**
   - `ClinicalAttention` valida que `evolutionNotes` no esté vacío, que la atención esté en estado `OPEN` antes de permitir ediciones o agregar materiales (si está `CLOSED`, lanza `ClinicalAttentionClosedError` `422`), y nunca instancia `new Date()` en el dominio.
   - `AttentionMaterialUsed` valida que `quantity` sea entero $> 0$ y, si se proporciona `toothNumber`, lo valida mediante `ToothNumber.of(...)` de `modules/clinical/domain`.
   - `ClinicalAttentionRepositoryPort` (`CLINICAL_ATTENTION_REPOSITORY_PORT`) expone 3 métodos cohesivos (ISP $\le 5$): `findById(clinicId, id)`, `findAllByPatientId(clinicId, patientId)` y `save(attention)`.

3. **Transacción Atómica entre `clinical` y `catalogs` vía `index.ts` Público (`RC-017`):**
   - `AddAttentionMaterialUsedUseCase` importa `ConsumeMaterialStockUseCase` desde `../../../catalogs` (su `index.ts` público) y ejecuta dentro de `this.unitOfWork.execute(async () => { ... })`:
     1. Verifica que la atención exista en el `clinicId` y esté `OPEN`.
     2. Descuenta el stock con `consumeMaterialStockUseCase.execute({ clinicId, materialId, quantity })` (que retorna el agregado `Material` actualizado o lanza `InsufficientMaterialStockError` `422`).
     3. Crea `AttentionMaterialUsed` con la marca, referencia, tipo y color del material y lo agrega a `ClinicalAttention`.
     4. Persiste `attentionRepository.save(attention)`.
   - Como `PrismaService` propaga el cliente transaccional con `AsyncLocalStorage`, si falla el guardado o el stock es insuficiente, toda la operación hace rollback en PostgreSQL.

4. **Contrato OpenAPI y Ocultamiento de `privateNotes` por Rol en el Servidor (`RF-B-027`, `RNF-B-004`, `RC-005`):**
   - `POST /v1/clinical-attentions`, `PATCH /v1/clinical-attentions/:id` y `POST /v1/clinical-attentions/:id/materials`: exclusivos para `ADMIN` (`403 FORBIDDEN_ROLE` para `AUXILIARY`).
   - `GET /v1/clinical-attentions/patient/:patientId` y `GET /v1/clinical-attentions/:id`: permitidos para `ADMIN` y `AUXILIARY`, pero la consulta evalúa `viewerRole`: si `viewerRole !== UserRole.ADMIN`, devuelve `privateNotes: null`.

## Risks / Trade-offs
- **[Risk] Desincronización de stock si falla el registro del material en la atención** → *Mitigación:* Ejecutar el descuento de inventario y la persistencia de la atención dentro de `UnitOfWorkPort.execute(...)` sobre el mismo contexto transaccional de Prisma.
- **[Risk] Exposición accidental de `privateNotes` o `evolutionNotes` en logs/Sentry o al rol `AUXILIARY`** → *Mitigación:* Redactar `evolutionNotes`, `prescription`, `postOperativeIndications`, `proceduresPerformed` y `privateNotes` en Pino/Sentry y probar explícitamente en unitarias y E2E que `AUXILIARY` recibe `privateNotes: null`.