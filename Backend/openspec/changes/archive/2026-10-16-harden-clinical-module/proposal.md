# Proposal

## Why
Antes de iniciar el módulo de agenda (`B-13`), es indispensable saldar los hallazgos de auditoría acumulados entre `B-07` y `B-12` en `modules/clinical`, `modules/catalogs` y las suites de contrato transversales. Esto garantiza que las notas privadas tengan doble barrera de ocultamiento por rol, que las pruebas de contrato nunca puedan borrar una base no autorizada, que la historia clínica conserve versiones inmutables y se guarde transaccionalmente, que el odontograma soporte concurrencia optimista (`RNF-F-033`), que el descuento de stock sea atómico en PostgreSQL sin pérdida de actualizaciones, y que dientes FDI, superficies, diagnósticos y códigos de procedimiento estén estrictamente validados para `billing`.

- **Requisitos cubiertos:** RF-B-020, RF-B-022, RF-B-023, RF-B-024, RF-B-025, RF-B-026, RF-B-027, RF-B-028, RF-B-029, RF-B-030, RF-B-040, RF-B-041, RF-B-044, RF-B-050, RF-B-053, RNF-B-004, RNF-B-005, RNF-B-009, RNF-B-012, RNF-B-013, RNF-B-030, RNF-B-032, RNF-F-033, RC-001, RC-002, RC-003, RC-005, RC-011, RC-012, RC-015, RC-016, RC-017, RC-018, RC-023, RC-030, RC-050, RC-055, RC-070, RC-074.
- **Change equivalente en Frontend:** `add-clinical-history-and-antecedents-ui`, `add-interactive-svg-odontogram` y `add-attention-workflow-and-materials-ui`.

## What Changes
- **Doble barrera de `privateNotes` (`RF-B-027`, `RC-005`):** Agregar `maskPrivateNotesForViewer(viewerRole)` en `ClinicalAttention` y exigir `viewerRole` en `ClinicalAttentionResponseDto.fromDomain` y `ClinicalAttentionVersionResponseDto.fromDomain`.
- **Guarda de borrado en base de pruebas (`RC-018`, `RC-050`):** Centralizar `cleanDatabaseForContractTests(prisma)` verificando que `DATABASE_URL` sea local/test antes de ejecutar `deleteMany()` en las 7 suites de contrato.
- **Transacciones, versionado de `ClinicalHistory` y limpieza de índices (`RC-055`, `RNF-B-013`):** Crear el modelo `ClinicalHistoryVersion` (`onDelete: Restrict`), eliminar los 3 `@@index` duplicados en `schema.prisma`, persistir `ClinicalHistory` y sus versiones dentro de `UnitOfWorkPort`, y envolver `CloseClinicalAttentionUseCase` (guardado + `eventBus.publishAll`) en `UnitOfWorkPort`.
- **Stock atómico y `ParseUUIDPipe` en `catalogs` (`RF-B-053`):** Implementar descuento condicional atómico en `MaterialRepositoryPort.consumeStockAtomically` (`currentStock >= quantity` con `decrement`) y añadir `ParseUUIDPipe` en `CatalogsController` y `UsersController`.
- **Concurrencia optimista en Odontograma (`RNF-F-033`):** Soportar `expectedUpdatedAt` en `PUT /v1/odontograms/patient/:patientId`, devolviendo `409 ODONTOGRAM_CONFLICT` ante ediciones concurrentes.
- **Validación estricta de dominio y benchmark de PDF (`RC-011`, `RC-012`, `RC-030`):** Tipar `ClinicalDiagnosis` VO (eliminando `unknown[]`), validar `ToothNumber` FDI y `ToothSurface` en `TreatmentPlanItem` y `ProcedurePerformed`, validar `proceduresPerformed[].code` contra `ProcedureRepositoryPort`, y probar tiempo/memoria del PDF con 200 atenciones.

## Capabilities

### New Capabilities
*(Ninguna)*

### Modified Capabilities
- `clinical-history-management`: Versionado inmutable al actualizar la historia clínica, diagnósticos tipados, validación FDI en plan de tratamiento y benchmark de PDF con 200 atenciones.
- `odontogram-management`: Control de concurrencia optimista mediante `expectedUpdatedAt` (`409 ODONTOGRAM_CONFLICT`).
- `clinical-attentions-management`: Doble barrera de ocultamiento de `privateNotes` por rol, validación de diente FDI, superficie y código de procedimiento del catálogo, y cierre transaccional con publicación de eventos dentro de `UnitOfWorkPort`.
- `catalogs-management`: Descuento atómico de existencias sin pérdida de actualizaciones concurrentes y validación `ParseUUIDPipe` en rutas por ID.

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/prisma/migrations/`, `Backend/src/shared/`, `Backend/src/modules/identity/`, `Backend/src/modules/patients/`, `Backend/src/modules/catalogs/`, `Backend/src/modules/clinical/`, `Backend/test/`, `Backend/openapi.json`, `Backend/openspec/config.yaml`.