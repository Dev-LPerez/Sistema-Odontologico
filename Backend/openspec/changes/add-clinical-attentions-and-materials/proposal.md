# Proposal

## Why
Con la historia clínica base (`B-08`) y el odontograma estructurado (`B-09`) completados, el siguiente paso del módulo `modules/clinical` es permitir a la Dra. Angelee Pacheco registrar cada atención clínica (evolución por cita), prescripciones médicas e indicaciones postoperatorias, las notas privadas confidenciales exclusivas de la doctora y el uso detallado de sus materiales propios por diente (marca, referencia, tipo y color como `A1`, `A2`, `BW`), descontando automáticamente las existencias del inventario de forma atómica.

- **Requisitos cubiertos:** RF-B-024, RF-B-025, RF-B-026, RF-B-027, RF-B-053, RNF-B-004, RNF-B-009, RNF-B-012, RNF-B-032, RC-001, RC-002, RC-003, RC-005, RC-012, RC-015, RC-016, RC-017, RC-018, RC-023, RC-050, RC-055, RC-070, RC-074.
- **Change equivalente en Frontend:** `add-attention-workflow-and-materials-ui`.

## What Changes
- Agregar en `Backend/prisma/schema.prisma` el enum `ClinicalAttentionStatus` (`OPEN`, `CLOSED`) y los modelos `ClinicalAttention` y `AttentionMaterialUsed` vinculados a `Clinic`, `Patient`, `ClinicalHistory`, `User` y `Material` usando `onDelete: Restrict` (`RC-055`).
- Ampliar `CLINICAL_REDACT_PATHS` en `logger.config.ts` y `SENSITIVE_KEYS` en `sentry.sanitizer.ts` para censurar `evolutionNotes`, `prescription`, `postOperativeIndications` y `proceduresPerformed` (`RNF-B-009`, `RC-023`).
- Implementar en `domain` de `modules/clinical` el enum `ClinicalAttentionStatus`, la entidad hija `AttentionMaterialUsed`, el agregado `ClinicalAttention`, los errores tipados (`InvalidClinicalAttentionDataError`, `ClinicalAttentionNotFoundError`, `ClinicalAttentionClosedError`) y el puerto `ClinicalAttentionRepositoryPort`.
- Implementar en `application` los casos de uso `CreateClinicalAttentionUseCase`, `UpdateClinicalAttentionUseCase`, `AddAttentionMaterialUsedUseCase` (orquestando `ConsumeMaterialStockUseCase` de `modules/catalogs` dentro de `UnitOfWorkPort`) y las consultas `ListClinicalAttentionsByPatientQuery` y `GetClinicalAttentionByIdQuery` (ocultando `privateNotes` cuando consulta el rol `AUXILIARY`).
- Implementar en `infrastructure` los repositorios `InMemory` y `Prisma` con suite de pruebas de contrato contra PostgreSQL real (`RC-018`, `RC-050`).
- Exponer `ClinicalAttentionsController` (`/v1/clinical-attentions/...`) con pruebas E2E de permisos por rol (`RC-005`) y regenerar `Backend/openapi.json`.

## Capabilities

### New Capabilities
- `clinical-attentions-management`: Registro y actualización de atenciones clínicas abiertas con evolución, fórmula médica, indicaciones postoperatorias, notas privadas confidenciales ocultas para auxiliar y registro transaccional de materiales propios usados por diente con descuento automático de stock.

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/prisma/migrations/`, `Backend/src/shared/infrastructure/`, `Backend/src/modules/clinical/`, `Backend/test/clinical-attentions.e2e-spec.ts`, `Backend/openapi.json`.