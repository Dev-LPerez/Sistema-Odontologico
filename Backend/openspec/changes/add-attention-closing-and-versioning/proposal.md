# Proposal

## Why
Con el registro de atenciones clínicas abiertas y el consumo atómico de materiales (`B-10`) completados, el siguiente paso en `modules/clinical` es implementar el cierre formal de la atención clínica y su versionado inmutable ante enmiendas posteriores. La Dra. Angelee Pacheco necesita cerrar cada atención una vez completados los procedimientos y la evolución (bloqueando cierres incompletos), e impedir que una atención cerrada sea sobrescrita silenciosamente: cualquier edición posterior al cierre debe exigir un motivo de modificación y conservar una versión histórica inmutable del estado anterior con fecha y autor.

- **Requisitos cubiertos:** RF-B-027, RF-B-028, RF-B-029, RF-B-030, RNF-B-004, RNF-B-009, RNF-B-012, RNF-B-032, RC-001, RC-002, RC-003, RC-005, RC-012, RC-015, RC-016, RC-017, RC-018, RC-023, RC-050, RC-055, RC-070, RC-074.
- **Change equivalente en Frontend:** `add-attention-workflow-and-materials-ui`.

## What Changes
- Agregar en `Backend/prisma/schema.prisma` el modelo `ClinicalAttentionVersion` (`@@map("clinical_attention_versions")`) vinculado a `Clinic`, `ClinicalAttention` y `User` con `onDelete: Restrict` (`RC-055`) y restricción única `@@unique([clinicId, attentionId, versionNumber])`.
- Ampliar `CLINICAL_REDACT_PATHS` en `logger.config.ts` y `SENSITIVE_KEYS` en `sentry.sanitizer.ts` para censurar `previousData` y `changeReason` (`RNF-B-009`, `RC-023`).
- Extender en `domain` de `modules/clinical` el agregado `ClinicalAttention` (validación de completitud al cerrar y método `amend` para atenciones cerradas), crear la entidad inmutable `ClinicalAttentionVersion`, los errores tipados (`IncompleteClinicalAttentionError`, `ClinicalAttentionNotClosedError`, `DuplicateClinicalAttentionVersionError`) y el puerto `ClinicalAttentionVersionRepositoryPort`.
- Implementar en `application` los casos de uso `CloseClinicalAttentionUseCase`, `AmendClosedClinicalAttentionUseCase` (persistiendo la versión previa y la atención actualizada dentro de `UnitOfWorkPort`) y la consulta `ListClinicalAttentionVersionsQuery` (enmascarando `previousData.privateNotes: null` para el rol `AUXILIARY`).
- Implementar en `infrastructure` los repositorios `InMemory` y `Prisma` de versiones con traducción de `P2002` a `DuplicateClinicalAttentionVersionError` (`409`) y suite de pruebas de contrato contra PostgreSQL real (`RC-018`, `RC-050`).
- Exponer en `ClinicalAttentionsController` los endpoints `POST /v1/clinical-attentions/:id/close`, `POST /v1/clinical-attentions/:id/amend` y `GET /v1/clinical-attentions/:id/versions`, con pruebas E2E de permisos por rol (`RC-005`) y regenerar `Backend/openapi.json`.

## Capabilities

### New Capabilities
*(Ninguna)*

### Modified Capabilities
- `clinical-attentions-management`: Se agregan los requisitos de cierre validado de atención clínica (`OPEN` a `CLOSED`), bloqueo de edición ordinaria tras el cierre, enmienda de atención cerrada con creación atómica de versión histórica inmutable y consulta del historial de versiones protegiendo `privateNotes` por rol.

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/prisma/migrations/`, `Backend/src/shared/infrastructure/`, `Backend/src/modules/clinical/`, `Backend/test/clinical-attentions.e2e-spec.ts`, `Backend/openapi.json`.