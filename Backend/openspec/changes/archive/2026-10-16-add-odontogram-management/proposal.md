# Proposal

## Why
Con la historia clínica base (`B-08`) completada y archivada, el siguiente paso del módulo `modules/clinical` es incorporar el odontograma estructurado del paciente. La Dra. Angelee Pacheco necesita registrar el estado dental de las 32 piezas permanentes y opcionalmente las 20 piezas temporales (nomenclatura FDI), detallando hallazgos estandarizados por superficie (`OCCLUSAL`, `VESTIBULAR`, `LINGUAL`, `MESIAL`, `DISTAL`, `WHOLE_TOOTH`) y distinguiendo su estado (`EXISTING`, `PLANNED`, `PERFORMED`), además de guardar instantáneas históricas inmutables por fecha para comparar la evolución del paciente y renderizar el odontograma en el PDF clínico.

- **Requisitos cubiertos:** RF-B-022, RF-B-040, RF-B-041, RF-B-042, RF-B-043, RF-B-044, RNF-B-004, RNF-B-009, RNF-B-012, RNF-B-032, RC-001, RC-002, RC-003, RC-005, RC-012, RC-015, RC-016, RC-017, RC-018, RC-023, RC-050, RC-055, RC-070, RC-074.
- **Change equivalente en Frontend:** `add-interactive-svg-odontogram`.

## What Changes
- Agregar en `Backend/prisma/schema.prisma` los modelos `Odontogram` y `OdontogramSnapshot` vinculados a `Clinic` y `Patient` con `onDelete: Restrict` (`RC-055`), almacenando el mapa de hallazgos por diente/superficie en columnas `Json` (`JSONB` en PostgreSQL, `RF-B-044`).
- Ampliar las rutas de redacción clínica en `logger.config.ts` y `sentry.sanitizer.ts` para censurar `teethState`, `snapshotData` y `toothFindings` (`RNF-B-009`, `RC-023`).
- Implementar en `domain` de `modules/clinical` los objetos de valor y enums del odontograma (`ToothNumber` FDI para 32 permanentes y 20 temporales, `ToothSurface`, `FindingCatalogCode`, `FindingStatus`, `ToothFinding`), el agregado `Odontogram` y la entidad inmutable `OdontogramSnapshot`, junto con sus puertos segregados (`OdontogramRepositoryPort` y `OdontogramSnapshotRepositoryPort`).
- Implementar en `application` los casos de uso `UpsertPatientOdontogramUseCase` y `CreateOdontogramSnapshotUseCase`, y las consultas `GetOdontogramByPatientQuery` y `ListOdontogramSnapshotsQuery`.
- Implementar en `infrastructure` los repositorios `InMemory` y `Prisma` con traducción de `P2002` a `409 CONFLICT` y suite de contrato contra PostgreSQL real (`RC-018`, `RC-050`).
- Exponer `OdontogramController` (`/v1/odontograms/...`) con pruebas E2E de permisos por rol (`RC-005`) y regenerar `Backend/openapi.json`.

## Capabilities

### New Capabilities
- `odontogram-management`: Gestión del odontograma estructurado en JSONB por paciente (32 piezas permanentes y 20 temporales, hallazgos estandarizados por superficie y estado) y generación/consulta de instantáneas históricas inmutables por fecha.

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/prisma/migrations/`, `Backend/src/shared/infrastructure/`, `Backend/src/modules/clinical/`, `Backend/test/odontogram.e2e-spec.ts`, `Backend/openapi.json`.