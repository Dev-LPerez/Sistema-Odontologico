# Design

## Context
El esqueleto del proyecto ya cuenta con `/health`, `/ready`, Prisma y validación de capas con `.dependency-cruiser.js`. Como las reglas RC-012 y RC-016 prohíben que `domain` y `application` importen librerías de infraestructura o instancien relojes y UUIDs con `new`, es necesario construir `Backend/src/shared/` antes del módulo `identity`. Ver `proposal.md` para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Proveer las clases base de dominio (`DomainError`, `DomainEvent`, `AggregateRoot`) sin dependencias externas.
- Definir e implementar `ClockPort`, `IdGeneratorPort`, `UnitOfWorkPort` y `EventBusPort` ensamblados en un `SharedModule` global.
- Garantizar la traducción de errores de dominio a HTTP, la trazabilidad con `x-correlation-id` y la redacción de datos clínicos en Pino y Sentry.
- Dejar listos el glosario clínico, ADR-0001, el generador Plop y el workflow `.github/workflows/db-keepalive.yml`.

**Non-Goals:**
- No se crean tablas de negocio ni migraciones de Prisma en este cambio (`schema.prisma` no cambia).
- No se implementa aún la autenticación JWT ni los roles (`ADMIN`, `AUXILIARY`), que corresponden al cambio `add-clinic-and-identity-auth`.

## Decisions

1. **Propagación transaccional con `AsyncLocalStorage` en `PrismaService`:**
   - *Decisión:* `PrismaService` mantiene un `AsyncLocalStorage<Prisma.TransactionClient>()` y expone un getter `client` que retorna el cliente transaccional activo o el `PrismaClient` raíz. `PrismaUnitOfWorkAdapter.execute(work)` abre `this.prisma.$transaction(tx => this.prisma.runInTransaction(tx, work))`.
   - *Alternativa descartada:* Pasar un objeto `TransactionContext` por los argumentos de todos los repositorios y casos de uso, lo cual ensucia la firma de los puertos en `domain` y `application`.

2. **Formateo de zona horaria `America/Bogota` con `Intl.DateTimeFormat` nativo:**
   - *Decisión:* `SystemClockAdapter` utiliza `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' })` para obtener `YYYY-MM-DD` de forma determinista sin añadir librerías pesadas de fechas.
   - *Alternativa descartada:* Aritmética manual de milisegundos o dependencias adicionales cuando el runtime de Node 20+ ya incluye soporte completo de IANA Time Zones.

3. **Doble barrera de redacción clínica (Pino `redact` + función pura `sanitizeSentryEvent`):**
   - *Decisión:* Configurar caminos explícitos de redacción en Pino (`*.password`, `*.token`, `*.diagnosis`, `*.notes`, `*.privateNotes`, `*.antecedents`, `*.findings`, `*.odontogram`, `*.documentNumber`, `*.phone`) y una función recursiva `sanitizeSentryEvent` para `beforeSend` de Sentry.
   - *Justificación:* Cumple estrictamente RNF-B-009 y RC-023 y permite probar unitariamente la sanitización sin depender de red.

4. **Registro de ADR-0001:**
   - Se documenta la arquitectura de 4 capas y el uso del Kernel Compartido en `Backend/docs/adr/0001-clean-architecture-and-shared-kernel.md` (RC-072).

## Risks / Trade-offs
- **[Risk] Pérdida de contexto en `AsyncLocalStorage` si se usan callbacks legacy no basados en Promesas** → *Mitigación:* Todo el stack (NestJS, Prisma 5+) utiliza `async/await` nativo sobre Promesas de Node 20+, preservando el contexto asíncrono de principio a fin.
- **[Risk] Bloqueo accidental de health checks por `@nestjs/throttler`** → *Mitigación:* Configurar un límite holgado por defecto (ej. 100 peticiones por minuto por IP) que permita el monitoreo de `/health` y `/ready` y endurecer límites específicos en los endpoints de login en B-03.