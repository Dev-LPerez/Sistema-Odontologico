# Design

## Context
Tras completar `B-07` (`catalogs`) y `B-08` a `B-12` (`clinical`), la auditoría arquitectónica identificó brechas de concurrencia, tipado de dominio, atomicidad transaccional y seguridad en pruebas que deben cerrarse antes de construir `modules/scheduling` (`B-13`) y `modules/billing` (`B-17`/`B-18`).

- **Módulos y capas afectadas:**
  - `shared/infrastructure/prisma`: Utilidad centralizada de limpieza segura para pruebas de contrato.
  - `modules/catalogs` (`domain`, `application`, `infrastructure`, `presentation`): Descuento atómico de stock y `ParseUUIDPipe`.
  - `modules/clinical` (`domain`, `application`, `infrastructure`, `presentation`): Doble barrera de `privateNotes`, `ClinicalHistoryVersion`, `ClinicalDiagnosis` VO, validación de `ToothNumber`, `ToothSurface` y código de procedimiento en `proceduresPerformed`, concurrencia optimista en `Odontogram`, transacciones con `UnitOfWorkPort` y benchmark de PDF con 200 atenciones.
- **Puertos nuevos o modificados:**
  - `ClinicalHistoryVersionRepositoryPort` (`CLINICAL_HISTORY_VERSION_REPOSITORY_PORT`) en `modules/clinical/domain/clinical-history-version.repository.port.ts`.
  - `MaterialRepositoryPort`: se añade `consumeStockAtomically(clinicId: string, id: string, quantity: number, updatedAt: Date): Promise<Material>` (quedando en 5 métodos, respetando el límite ISP $\le 5$).
  - `OdontogramRepositoryPort`: `save(odontogram: Odontogram, expectedUpdatedAt?: Date): Promise<void>`.
- **Eventos de dominio:** `AttentionClosedEvent` pasa a publicarse dentro del bloque `UnitOfWorkPort.execute(...)` en `CloseClinicalAttentionUseCase`.
- **ADR:** No requiere un nuevo ADR; refuerza el cumplimiento estricto de `ADR-0001`.

## Goals / Non-Goals

**Goals:**
- Garantizar en el dominio y en la capa de presentación (DTOs) que `privateNotes` y `previousData.privateNotes` sean `null` para cualquier rol distinto de `ADMIN` (`RF-B-027`, `RC-005`).
- Impedir que las suites de contrato (`*.contract.spec.ts`) ejecuten `deleteMany()` si la conexión no apunta a una base de datos de pruebas/local autorizada (`RC-018`, `RC-050`).
- Conservar versiones históricas inmutables (`ClinicalHistoryVersion`) cada vez que se actualice una `ClinicalHistory`, ejecutando la escritura de la versión y de la historia dentro de `UnitOfWorkPort` (`RC-055`, `RNF-B-012`, `RNF-B-013`).
- Eliminar la condición de carrera (*Lost Update*) en el descuento de stock de materiales propios mediante actualización condicional atómica en PostgreSQL (`RF-B-053`).
- Impedir sobrescrituras silenciosas en el odontograma (`RNF-F-033`) validando concurrencia optimista con `expectedUpdatedAt` (`409 ODONTOGRAM_CONFLICT`).
- Validar `ToothNumber` FDI en `TreatmentPlanItem` y `ProcedurePerformed`, `ToothSurface` en `ProcedurePerformed`, `ClinicalDiagnosis` VO en `ClinicalHistory` y existencia del `code` de `ProcedurePerformed` en `ProcedureRepositoryPort`.
- Verificar que la generación del PDF con 200 atenciones clínicas se ejecute dentro del presupuesto de memoria (512 MB en Render) y rendimiento (`RC-030`).

**Non-Goals:**
- Implementar agendamiento de citas (corresponde a `B-13`).
- Implementar el módulo `audit` completo (corresponde a `B-20`).

## Decisions

1. **Doble Barrera de Ocultamiento de `privateNotes` por Rol (`RF-B-027`, `RC-005`):**
   - En `ClinicalAttention`, se añade el método de dominio `maskPrivateNotesForViewer(viewerRole: string): ClinicalAttention` que devuelve una instancia con `privateNotes: null` cuando `viewerRole !== 'ADMIN'`.
   - En `ClinicalAttentionResponseDto.fromDomain(attention: ClinicalAttention, viewerRole: UserRole = UserRole.ADMIN)` y `ClinicalAttentionVersionResponseDto.fromDomain(version: ClinicalAttentionVersion, viewerRole: UserRole = UserRole.ADMIN)`, el mapeador aplica además `viewerRole === UserRole.ADMIN ? ... : null`. En `ClinicalAttentionsController`, todos los endpoints pasan `user.role as UserRole` a `fromDomain`.

2. **Guarda de Seguridad y Limpieza Centralizada en Pruebas de Contrato (`RC-018`, `RC-050`):**
   - Se crea `Backend/src/shared/infrastructure/prisma/test-database-cleaner.util.ts` con `assertSafeTestDatabase(databaseUrl?: string, nodeEnv?: string)` y `cleanDatabaseForContractTests(prisma: PrismaService)`.
   - Si `nodeEnv === 'production'` o la URL no apunta a un host local (`localhost`, `127.0.0.1`, `postgres`) ni a una base terminada en `_test` (salvo `ALLOW_CONTRACT_DB_CLEANUP === 'true'`), lanza un error inmediato abortando cualquier borrado.
   - Las 7 suites de contrato (`identity`, `patients-repository`, `patients-queries`, `catalogs`, `clinical-history`, `odontogram`, `clinical-attention`) reemplazan su `cleanDb()` duplicado por `cleanDatabaseForContractTests(realPrisma)`.

3. **Esquema Prisma: `ClinicalHistoryVersion` y Eliminación de Índices Duplicados (`RC-055`, `RNF-B-013`):**
   - Se agrega en `schema.prisma` el modelo `ClinicalHistoryVersion` (`@@map("clinical_history_versions")`): `id`, `clinicId`, `clinicalHistoryId`, `versionNumber` (`Int`), `previousData` (`Json`), `changeReason` (`String?`), `updatedByUserId` (`String?`), `createdAt` (`DateTime`), con `@@unique([clinicId, clinicalHistoryId, versionNumber])` y FKs a `Clinic` y `ClinicalHistory` con `onDelete: Restrict`.
   - Se eliminan los 3 índices redundantes que duplicaban restricciones únicas: `@@index([clinicId, patientId])` en `ClinicalHistory`, `@@index([clinicId, patientId])` en `Odontogram` y `@@index([clinicId, attentionId, versionNumber])` en `ClinicalAttentionVersion`.
   - En `PrismaClinicalHistoryRepository.save`, la sincronización de `treatmentPlanItem` (borrado de ítems removidos si aplica + `upsert` de cabecera e ítems) y en `UpdateClinicalHistoryUseCase` / `AddTreatmentPlanItemUseCase` / `UpdateTreatmentPlanItemStatusUseCase` se ejecutan dentro de `UnitOfWorkPort.execute(...)`.
   - Se expone `GET /v1/clinical-histories/patient/:patientId/versions` (`@Roles(UserRole.ADMIN, UserRole.AUXILIARY)`) para consultar el historial de versiones de la historia clínica.

4. **Descuento Atómico de Stock en `MaterialRepositoryPort` (`RF-B-053`):**
   - En `PrismaMaterialRepository.consumeStockAtomically(clinicId, id, quantity, updatedAt)`:
     1. Verifica primero `Material.validateConsumeQuantity(quantity)`.
     2. Ejecuta `this.prisma.client.material.updateMany({ where: { id, clinicId, isActive: true, currentStock: { gte: quantity } }, data: { currentStock: { decrement: quantity }, updatedAt } })`.
     3. Si `result.count === 0`, consulta `findById(clinicId, id)`: si no existe lanza `MaterialNotFoundError`; si `!material.isActive` lanza `InvalidCatalogDataError`; y si `material.currentStock < quantity` lanza `InsufficientMaterialStockError(material.currentStock, quantity)` (`422`).
     4. Si `result.count === 1`, retorna el `Material` actualizado.
   - `ConsumeMaterialStockUseCase` delega en `consumeStockAtomically`, eliminando el patrón *read-modify-write* sin bloqueo.

5. **Concurrencia Optimista en `Odontogram` (`RNF-F-033`):**
   - `UpsertOdontogramDto` acepta `expectedUpdatedAt?: string` (`@IsOptional() @IsDateString()`).
   - Si el odontograma ya existe y el cliente envía `expectedUpdatedAt`, `Odontogram.updateFindings` / `UpsertPatientOdontogramUseCase` y `PrismaOdontogramRepository.save` verifican que `existing.updatedAt.getTime() === new Date(expectedUpdatedAt).getTime()`. Si difiere, lanza `OdontogramConflictError` (`409`, `ODONTOGRAM_CONFLICT`).

6. **Tipado de `ClinicalDiagnosis`, Validación de `ToothNumber`/`ToothSurface` y Vínculo de `ProcedurePerformed` al Catálogo (`RC-011`, `RC-012`, `RC-017`):**
   - `ClinicalDiagnosis` VO (`domain/clinical-diagnosis.vo.ts`): encapsula `{ code: string | null; description: string }` validando que `description` (o `code`) no sea vacío. `ClinicalHistory.diagnoses` pasa a ser `ReadonlyArray<ClinicalDiagnosis>`.
   - `TreatmentPlanItem.create` valida `toothNumber` con `ToothNumber.of(...)` cuando se envía.
   - `ClinicalAttention` valida en cada elemento de `proceduresPerformed`:
     - Si `toothNumber` está presente, lo normaliza y valida con `ToothNumber.of(...)`.
     - Si `surface` está presente, valida que pertenezca al enum `ToothSurface` (aceptando también su equivalente normalizado en mayúsculas).
   - `CreateClinicalAttentionUseCase`, `UpdateClinicalAttentionUseCase` y `AmendClosedClinicalAttentionUseCase` inyectan `PROCEDURE_REPOSITORY_PORT` (desde `../../../catalogs`) y verifican que cada `p.code` exista en el catálogo del consultorio (`findByCode`), completando `p.name = p.name ?? procedure.name` o lanzando `ProcedureNotFoundError` (`404`) si el código no existe.
   - `CloseClinicalAttentionUseCase` inyecta `UnitOfWorkPort` y ejecuta `findById` + `attention.close(now)` + `save` + `eventBus.publishAll` dentro de `this.unitOfWork.execute(...)`.

## Risks / Trade-offs
- **[Risk] Ruptura de clientes o pruebas existentes al validar `proceduresPerformed[].code` contra el catálogo** → *Mitigación:* Si un procedimiento se envía en una atención, su código debe existir en `ProcedureRepositoryPort`; actualizaremos los fixtures de pruebas para sembrar el procedimiento en el catálogo, reflejando fielmente la realidad clínica del consultorio.
- **[Risk] Falsos positivos en la guarda `assertSafeTestDatabase` en GitHub Actions** → *Mitigación:* El contenedor de servicio de PostgreSQL en GitHub Actions corre en `localhost:5432` con `NODE_ENV=test`, lo cual es reconocido explícitamente como seguro por la guarda.