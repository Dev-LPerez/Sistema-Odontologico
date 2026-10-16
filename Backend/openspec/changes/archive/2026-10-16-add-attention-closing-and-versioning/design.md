# Design

## Context
En **B-10 (`add-clinical-attentions-and-materials`)** implementamos la creación y edición de atenciones clínicas en estado `OPEN` junto con el consumo transaccional de materiales propios. En **B-11 (`add-attention-closing-and-versioning`)** completamos el ciclo de vida de `ClinicalAttention` implementando su cierre formal (`RF-B-028`, `RF-B-029`) y el mecanismo normativo de enmienda con preservación de versiones históricas inmutables (`RF-B-030`, `RNF-B-012`), manteniendo el cambio acotado bajo ~400 líneas (`RC-014`).

- **Módulo y capas afectadas:** `modules/clinical` (`domain`, `application`, `infrastructure`, `presentation`) y `shared/infrastructure` (`logger` y `sentry`).
- **Puertos nuevos:** `ClinicalAttentionVersionRepositoryPort` (`CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT`).
- **Eventos de dominio:** Ninguno externo nuevo en este change.
- **ADR:** No requiere un nuevo ADR; sigue `ADR-0001` (Clean Architecture y transacciones atómicas con `UnitOfWorkPort`).

## Goals / Non-Goals

**Goals:**
-Permitir exclusivamente al rol `ADMIN` cerrar una atención clínica abierta (`POST /v1/clinical-attentions/:id/close`), validando en el dominio que tenga al menos un procedimiento registrado en `proceduresPerformed` (con `code` no vacío) y `evolutionNotes` no vacío (`RF-B-028`, `RF-B-029`).
- Garantizar que una vez cerrada (`CLOSED`), la edición ordinaria (`PATCH /v1/clinical-attentions/:id`) y la adición de materiales (`POST /v1/clinical-attentions/:id/materials`) sean rechazadas con `422 CLINICAL_ATTENTION_CLOSED`.
- Permitir exclusivamente al rol `ADMIN` enmendar una atención cerrada (`POST /v1/clinical-attentions/:id/amend`) exigiendo un motivo no vacío (`changeReason`), guardando atómicamente en `UnitOfWorkPort` una instancia inmutable `ClinicalAttentionVersion` con la instantánea exacta del estado previo antes de aplicar los cambios (`RF-B-030`, `RNF-B-012`).
- Permitir a `ADMIN` y `AUXILIARY` consultar las versiones históricas de una atención (`GET /v1/clinical-attentions/:id/versions`), ocultando `previousData.privateNotes: null` cuando consulta el rol `AUXILIARY` (`RF-B-027`, `RNF-B-004`, `RC-005`).

**Non-Goals:**
- Exportación del expediente clínico e historial de atenciones a PDF (corresponde a **B-12 `add-clinical-history-pdf-export`**).

## Decisions

1. **Esquema Prisma para `ClinicalAttentionVersion` con `onDelete: Restrict` (`RC-055`):**
   - `ClinicalAttentionVersion` (`@@map("clinical_attention_versions")`): `id` (UUID), `clinicId`, `attentionId`, `versionNumber` (`Int`), `previousData` (`Json`), `changeReason` (`String`), `amendedByUserId` (`String`), `createdAt` (`DateTime`).
   - Restricción única compuesta `@@unique([clinicId, attentionId, versionNumber])` e índice `@@index([clinicId, attentionId, versionNumber])`.
   - Claves foráneas hacia `Clinic`, `ClinicalAttention` y `User` con `onDelete: Restrict`.

2. **Reglas de Dominio en `ClinicalAttention` y `ClinicalAttentionVersion` (`RC-012`, `RC-016`):**
   - `ClinicalAttention.close(updatedAt: Date)`:
     - Si `status === ClinicalAttentionStatus.CLOSED`, lanza `ClinicalAttentionClosedError` (`422`).
     - Si `proceduresPerformed.length === 0` o algún procedimiento no tiene `code` válido, o `evolutionNotes` está vacío, lanza `IncompleteClinicalAttentionError` (`422`, `INCOMPLETE_CLINICAL_ATTENTION`).
     - Cambia `status` a `ClinicalAttentionStatus.CLOSED` y actualiza `updatedAt`.
   - `ClinicalAttention.toSnapshotData()`: retorna un objeto plano inmutable (`structuredClone`) con `{ proceduresPerformed, evolutionNotes, prescription, postOperativeIndications, privateNotes, attendedAt, updatedAt, materialsUsed }` que representa el estado exacto antes de una enmienda.
   - `ClinicalAttention.amend(props: AmendClinicalAttentionProps)`:
     - Si `status !== ClinicalAttentionStatus.CLOSED`, lanza `ClinicalAttentionNotClosedError` (`422`, `CLINICAL_ATTENTION_NOT_CLOSED`).
     - Valida que `changeReason` no esté vacío (si está vacío, lanza `InvalidClinicalAttentionDataError` `400`).
     - Valida que tras la enmienda `evolutionNotes` no quede vacío y `proceduresPerformed` conserve al menos un procedimiento válido (de lo contrario lanza `InvalidClinicalAttentionDataError` o `IncompleteClinicalAttentionError`).
     - Aplica los nuevos valores y actualiza `updatedAt`.
   - `ClinicalAttentionVersion`: entidad inmutable que valida `versionNumber >= 1`, `changeReason` obligatorio, `previousData` clonado profundamente (`structuredClone`) y método `maskPrivateNotesForViewer(viewerRole)` que devuelve una copia con `previousData.privateNotes = null` cuando `viewerRole !== UserRole.ADMIN`.
   - `ClinicalAttentionVersionRepositoryPort` (`CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT`): define 2 métodos cohesivos (ISP $\le 5$): `findAllByAttentionId(clinicId, attentionId)` y `save(version)`.

3. **Transacción Atómica en `AmendClosedClinicalAttentionUseCase` (`UnitOfWorkPort`):**
   - Dentro de `this.unitOfWork.execute(async () => { ... })`:
     1. Obtiene la atención por `(clinicId, id)` y verifica que esté `CLOSED`.
     2. Consulta las versiones existentes con `versionRepo.findAllByAttentionId(clinicId, id)` para calcular `nextVersionNumber = existingVersions.length + 1`.
     3. Construye `ClinicalAttentionVersion` con `previousData: attention.toSnapshotData()`, `changeReason` y `amendedByUserId`.
     4. Ejecuta `attention.amend(...)`.
     5. Persiste `versionRepo.save(version)` y `attentionRepo.save(attention)` en la misma transacción de Prisma.

4. **Contrato OpenAPI y Control de Acceso por Rol (`RC-005`, `RC-070`):**
   - `POST /v1/clinical-attentions/:id/close`: exclusivo `ADMIN` (`200 OK`).
   - `POST /v1/clinical-attentions/:id/amend`: exclusivo `ADMIN` (`200 OK`).
   - `GET /v1/clinical-attentions/:id/versions`: permitido para `ADMIN` y `AUXILIARY` (`200 OK`), ocultando `previousData.privateNotes` (`null`) cuando consulta `AUXILIARY`.

## Risks / Trade-offs
- **[Risk] Condición de carrera si dos peticiones intentan enmendar la misma atención cerrada simultáneamente** → *Mitigación:* El índice único `@@unique([clinicId, attentionId, versionNumber])` en PostgreSQL detecta la colisión `P2002` y `PrismaClinicalAttentionVersionRepository.save` (al igual que `InMemory`) la traduce a `DuplicateClinicalAttentionVersionError` (`409 CONFLICT`).
- **[Risk] Filtración de `privateNotes` históricas a través del endpoint de versiones al rol `AUXILIARY`** → *Mitigación:* `ListClinicalAttentionVersionsQuery` invoca `version.maskPrivateNotesForViewer(viewerRole)` en el servidor y se verifica en pruebas unitarias y E2E.