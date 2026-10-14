# Proposal

## Why
El esqueleto inicial (`add-project-skeleton`) dejó operativos `/health`, `/ready` y Prisma, pero antes de construir el primer módulo de negocio (`identity`) es obligatorio establecer el Kernel Compartido (`Backend/src/shared/`), la observabilidad segura y la protección HTTP transversal. Esto garantiza que ningún módulo de negocio instancie relojes o UUIDs con `new`, ni se acople a Prisma, ni filtre datos clínicos en logs o Sentry.

- **Requisitos cubiertos:** RC-012, RC-015, RC-016, RC-023, RC-054, RC-060, RC-061, RC-072, RC-074, RNF-B-005, RNF-B-006, RNF-B-009, RNF-B-044, RNF-B-045.
- **Change equivalente en Frontend:** `add-frontend-pwa-skeleton` y `add-offline-core-and-app-shell`.

## What Changes
- Crear las clases base de dominio en `shared/domain`: `DomainError`, `DomainEvent` y `AggregateRoot`.
- Definir los puertos transversales en `shared/application/ports`: `ClockPort` (UTC y `America/Bogota`), `IdGeneratorPort`, `UnitOfWorkPort` y `EventBusPort`.
- Implementar los adaptadores en `shared/infrastructure`: `SystemClockAdapter`, `UuidGeneratorAdapter`, `PrismaUnitOfWorkAdapter` (con `AsyncLocalStorage`) y `NestEventBusAdapter`.
- Configurar `CorrelationIdMiddleware`, logger JSON con Pino y redacción de campos clínicos/credenciales, sanitizador de eventos para Sentry y `DomainExceptionFilter` global.
- Activar `helmet`, CORS por entorno y `@nestjs/throttler`, y agregar `Backend/docs/glosario.md`, ADR-0001, `Backend/plopfile.js` y `.github/workflows/db-keepalive.yml`.

## Capabilities

### New Capabilities
- `shared-kernel`: Bloques base de Clean Architecture (`DomainError`, `AggregateRoot`, `ClockPort` en zona `America/Bogota`, `IdGeneratorPort`, `UnitOfWorkPort`, `EventBusPort`), traducción uniforme de errores a HTTP, trazabilidad con `x-correlation-id` y redacción de datos clínicos en logs y Sentry.

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/src/shared/`, `Backend/src/app.module.ts`, `Backend/src/main.ts`, `Backend/test/health.e2e-spec.ts`.
- **Dependencias nuevas:** `helmet`, `@nestjs/throttler`, `@nestjs/event-emitter`, `nestjs-pino`, `pino-http`, `@sentry/node`, `plop`.
- **Documentación y CI:** `Backend/docs/glosario.md`, `Backend/docs/adr/0001-clean-architecture-and-shared-kernel.md`, `Backend/plopfile.js`, `.github/workflows/db-keepalive.yml`.