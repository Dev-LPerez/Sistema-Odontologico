# Tasks

## Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto)

Cada escenario de `specs/odontogram-management/spec.md` DEBE estar cubierto por las siguientes pruebas con estos nombres exactos en `it(...)`:

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Contrato (PostgreSQL Real + InMemory) | Archivo E2E (`Backend/test/odontogram.e2e-spec.ts`) | 
| ----- | ----- | ----- | 
| **Scenario:** Administradora actualiza hallazgos en dientes permanentes y temporales y auxiliar consulta el odontograma | `upsert-patient-odontogram.use-case.spec.ts` y `odontogram-repositories.contract.spec.ts` -> `it('debe guardar, actualizar y consultar el odontograma estructurado con dientes permanentes y temporales aislando por clinicId')` | `it('debe permitir a ADMIN actualizar hallazgos en dientes permanentes y temporales y a AUXILIARY consultar el odontograma (200)')` | 
| **Scenario:** Rechazo por número de diente FDI inválido, superficie incompatible o código de hallazgo desconocido | `tooth-number.vo.spec.ts` y `odontogram.entity.spec.ts` -> `it('debe lanzar InvalidOdontogramDataError cuando el número de diente FDI es inválido o se registra un diente temporal con hasTemporalDentition en false')` | `it('debe rechazar con 400 INVALID_ODONTOGRAM_DATA cuando se envía un diente FDI inválido o diente temporal sin activar hasTemporalDentition')` | 
| **Scenario:** Bloqueo a rol AUXILIARY al intentar modificar el odontograma o crear una instantánea | `roles.guard.spec.ts` (cubierto) | `it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta modificar el odontograma o crear una instantánea')` | 
| **Scenario:** Creación de instantánea del odontograma y preservación inmutable tras cambios posteriores | `create-odontogram-snapshot.use-case.spec.ts` y `odontogram-repositories.contract.spec.ts` -> `it('debe crear una instantánea inmutable del odontograma y conservar su estado histórico aunque el odontograma cambie después')` | `it('debe permitir a ADMIN capturar una instantánea del odontograma y conservarla inmutable tras cambios posteriores (201/200)')` | 

## 1. Esquema Prisma, migración (`onDelete: Restrict`) y redacción en Logs/Sentry (RC-023, RC-050, RC-055)

- [x] 1.1 Agregar en `Backend/prisma/schema.prisma` los modelos `Odontogram` y `OdontogramSnapshot` vinculados a `Clinic` y `Patient` (y `OdontogramSnapshot` vinculado a `Odontogram`) usando explícitamente `onDelete: Restrict` en todas las relaciones Foreign Key, con `@@unique([clinicId, patientId])` en `Odontogram`.
- [x] 1.2 Crear la migración `Backend/prisma/migrations/20261015020000_add_odontogram_tables/migration.sql`, aplicarla sobre PostgreSQL local con `npx prisma migrate deploy` y ejecutar `pnpm --filter backend prisma:generate`.
- [x] 1.3 Ampliar `CLINICAL_REDACT_PATHS` en `Backend/src/shared/infrastructure/logger/logger.config.ts` y `SENSITIVE_KEYS` en `Backend/src/shared/infrastructure/sentry/sentry.sanitizer.ts` (más sus pruebas unitarias) para censurar `teethState`, `snapshotData` y `findings` (`RNF-B-009`, `RC-023`).
- [x] 1.4 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/prisma Backend/src/shared/infrastructure && git commit -m "feat(clinical): add Odontogram and OdontogramSnapshot schema and redact JSONB fields"`

## 2. Capa domain de odontograma en `modules/clinical` con TDD (RC-002, RC-012)

- [x] 2.1 Escribir las pruebas unitarias en rojo en `Backend/src/modules/clinical/domain/` (`tooth-number.vo.spec.ts`, `tooth-finding.vo.spec.ts`, `odontogram.entity.spec.ts`, `odontogram-snapshot.entity.spec.ts`) validando los 32 dientes permanentes FDI (`11-18`, `21-28`, `31-38`, `41-48`), los 20 temporales (`51-55`, `61-65`, `71-75`, `81-85`), rechazo de números FDI inválidos (`19`, `56`, `99`), catálogo de hallazgos, superficies, estados (`EXISTING`, `PLANNED`, `PERFORMED`) e inmutabilidad de instantáneas.
- [x] 2.2 Implementar en `Backend/src/modules/clinical/domain/` los enums `tooth-surface.enum.ts`, `finding-catalog.enum.ts` y `finding-status.enum.ts`, los objetos de valor `tooth-number.vo.ts` y `tooth-finding.vo.ts`, las entidades `odontogram.entity.ts` y `odontogram-snapshot.entity.ts`, los errores en `clinical.errors.ts` (`InvalidOdontogramDataError`, `OdontogramNotFoundError`, `DuplicateOdontogramError`) y los puertos `odontogram.repository.port.ts` y `odontogram-snapshot.repository.port.ts`.
- [x] 2.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/clinical/domain && git commit -m "feat(clinical): implement Odontogram, OdontogramSnapshot and FDI tooth value objects"`

## 3. Capa application de odontograma en `modules/clinical` con TDD (RC-002, RC-015, RC-016, RC-017)

- [x] 3.1 Escribir las pruebas unitarias en rojo en `Backend/src/modules/clinical/application/` para `upsert-patient-odontogram.use-case.spec.ts`, `create-odontogram-snapshot.use-case.spec.ts`, `get-odontogram-by-patient.query.spec.ts` y `list-odontogram-snapshots.query.spec.ts` usando los nombres exactos de la Matriz de Trazabilidad, dobles en memoria, `ClockPort` fijo e `IdGeneratorPort` determinista.
- [x] 3.2 Implementar `upsert-patient-odontogram.use-case.ts`, `create-odontogram-snapshot.use-case.ts`, `get-odontogram-by-patient.query.ts` y `list-odontogram-snapshots.query.ts` (un único método `execute` por clase, importando de `../../../patients` vía `index.ts` público).
- [x] 3.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/clinical/application && git commit -m "feat(clinical): implement odontogram upsert, snapshot creation and queries"`

## 4. Capa infrastructure y suite de contrato contra PostgreSQL real (RC-018, RC-050, RC-055)

- [x] 4.1 Implementar `odontogram.mapper.ts`, `in-memory-odontogram.repository.ts`, `in-memory-odontogram-snapshot.repository.ts`, `prisma-odontogram.repository.ts` y `prisma-odontogram-snapshot.repository.ts` en `Backend/src/modules/clinical/infrastructure/`, usando `this.prisma.client.*` y traduciendo `P2002` a `DuplicateOdontogramError` (`409`).
- [x] 4.2 Actualizar `cleanDb()` en las suites de contrato existentes (`identity`, `patients`, `catalogs`, `clinical-history`) para borrar `odontogramSnapshot` y `odontogram` antes de `patient` y `clinic`; y crear `Backend/src/modules/clinical/infrastructure/repositories/odontogram-repositories.contract.spec.ts` ejecutándola contra `InMemory` y **PostgreSQL real** (sin mocks de Prisma), incluyendo los bloques `it(...)` exactos de la Matriz de Trazabilidad, colisión `P2002` y pruebas de restricción `onDelete: Restrict`.
- [x] 4.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/clinical/infrastructure Backend/src/modules/identity/infrastructure Backend/src/modules/patients/infrastructure Backend/src/modules/catalogs/infrastructure && git commit -m "feat(clinical): add Prisma and InMemory odontogram repositories with real Postgres contract tests"`

## 5. Capa presentation, ensamblaje del módulo y pruebas E2E de permisos por rol (RC-005)

- [x] 5.1 Implementar los DTOs con `class-validator` y `@nestjs/swagger` en `Backend/src/modules/clinical/presentation/dto/` (`upsert-odontogram.dto.ts`, `create-odontogram-snapshot.dto.ts`, `odontogram-response.dto.ts`), el controlador `odontogram.controller.ts` + `odontogram.controller.spec.ts`, y registrar los nuevos proveedores, controladores y exports en `clinical.module.ts` e `index.ts`.
- [x] 5.2 Escribir y ejecutar la suite E2E `Backend/test/odontogram.e2e-spec.ts` utilizando `configureApp(app)` e implementando exactamente los 4 bloques `it(...)` de la columna E2E de la Matriz de Trazabilidad.
- [x] 5.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test` y `pnpm --filter backend test:e2e` en verde, y hacer commit: `git add Backend/src Backend/test && git commit -m "feat(clinical): add OdontogramController, module wiring and E2E role permission tests"`

## 6. Contrato OpenAPI y evidencia literal (`evidence.md`)

- [x] 6.1 Regenerar `Backend/openapi.json` (`pnpm --filter backend openapi:generate`) y verificar que los endpoints `/v1/odontograms/...` estén documentados sin tipos `"object"` ambiguos en campos anulables.
- [x] 6.2 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e`, y crear `Backend/openspec/changes/add-odontogram-management/evidence.md` con la Matriz de Trazabilidad 1:1 completada y la salida **literal e íntegra** de consola de los 5 comandos (incluyendo la tabla ASCII completa de cobertura).
- [x] 6.3 Confirmar todos los archivos con un commit: `git add -A && git commit -m "chore(clinical): regenerate openapi.json and record B-09 odontogram evidence"` dejando `git status` limpio.

## Workflow follow-up

Realiza la auditoría antes de ejecutar `/opsx-sync` y `/opsx-archive`.