# Tasks

## 1. Instalación de dependencias en Backend
- [x] 1.1 Instalar en `Backend/package.json` las dependencias de producción (`helmet`, `@nestjs/throttler`, `@nestjs/event-emitter`, `nestjs-pino`, `pino-http`, `@sentry/node`) y desarrollo (`plop`), verificando que `pnpm --filter backend build` compile sin errores.
- [x] 1.2 Confirmar los cambios de dependencias con un commit de Conventional Commits: `git add Backend/package.json pnpm-lock.yaml && git commit -m "chore(shared): install observability, security and plop dependencies"`

## 2. Implementación de shared/domain con TDD
- [x] 2.1 Escribir las pruebas unitarias en rojo `Backend/src/shared/domain/domain-error.spec.ts` y `Backend/src/shared/domain/aggregate-root.spec.ts` cubriendo categorías de error, metadatos y cola de eventos de dominio.
- [x] 2.2 Implementar `Backend/src/shared/domain/domain-error.ts`, `Backend/src/shared/domain/domain-event.ts` y `Backend/src/shared/domain/aggregate-root.ts` hasta poner las pruebas en verde con cobertura $\ge 90\%$.
- [x] 2.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/shared/domain && git commit -m "feat(shared): add DomainError, DomainEvent and AggregateRoot base classes"`

## 3. Definición de puertos en shared/application
- [x] 3.1 Crear los puertos `clock.port.ts` (`CLOCK_PORT`), `id-generator.port.ts` (`ID_GENERATOR_PORT`), `unit-of-work.port.ts` (`UNIT_OF_WORK_PORT`) y `event-bus.port.ts` (`EVENT_BUS_PORT`) en `Backend/src/shared/application/ports/`.
- [x] 3.2 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck` y `pnpm --filter backend test:arch` en verde, y hacer commit: `git add Backend/src/shared/application && git commit -m "feat(shared): define Clock, IdGenerator, UnitOfWork and EventBus ports"`

## 4. Adaptadores de shared/infrastructure con TDD
- [x] 4.1 Escribir las pruebas unitarias en rojo `system-clock.adapter.spec.ts` (incluyendo bordes de cambio de día a las 23:59 y 00:01 en `America/Bogota`) y `uuid-generator.adapter.spec.ts`, e implementar `system-clock.adapter.ts` y `uuid-generator.adapter.ts`.
- [x] 4.2 Escribir las pruebas unitarias en rojo `prisma-unit-of-work.adapter.spec.ts` y `nest-event-bus.adapter.spec.ts`, actualizar `PrismaService` con `AsyncLocalStorage` (`get client()`) e implementar `prisma-unit-of-work.adapter.ts` y `nest-event-bus.adapter.ts`.
- [x] 4.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/shared/infrastructure && git commit -m "feat(shared): implement SystemClock, UuidGenerator, PrismaUnitOfWork and NestEventBus adapters"`

## 5. Observabilidad, Correlation ID y Sanitización Clínica con TDD
- [x] 5.1 Escribir las pruebas en rojo `correlation-id.middleware.spec.ts`, `logger.redact.spec.ts` y `sentry.sanitizer.spec.ts` verificando la generación/propagación de `x-correlation-id` y el reemplazo por `"[REDACTED]"` de credenciales y campos clínicos (`diagnosis`, `notes`, `privateNotes`, `antecedents`, `findings`, `odontogram`, `documentNumber`, `phone`).
- [x] 5.2 Implementar `correlation-id.middleware.ts`, `logger.config.ts` y `sentry.sanitizer.ts` en `Backend/src/shared/infrastructure/` hasta pasar todas las pruebas en verde.
- [x] 5.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/shared/infrastructure/logger Backend/src/shared/infrastructure/sentry && git commit -m "feat(shared): add correlation-id middleware, Pino redaction and Sentry clinical sanitizer"`

## 6. Filtro HTTP global, SharedModule y Seguridad en main.ts
- [x] 6.1 Escribir la prueba unitaria en rojo `domain-exception.filter.spec.ts` para todas las categorías (`VALIDATION` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `INVARIANT_VIOLATION` 422) e implementar `Backend/src/shared/presentation/filters/domain-exception.filter.ts`.
- [x] 6.2 Crear `Backend/src/shared/infrastructure/shared.module.ts` (`@Global()`) y `Backend/src/shared/index.ts`, registrar `SharedModule`, `ThrottlerModule`, `CorrelationIdMiddleware`, `DomainExceptionFilter`, `helmet()` y CORS en `app.module.ts` y `main.ts`, y actualizar `Backend/test/health.e2e-spec.ts` verificando la cabecera `x-correlation-id`.
- [x] 6.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend test` y `pnpm --filter backend test:e2e` en verde, y hacer commit: `git add Backend/src Backend/test && git commit -m "feat(shared): wire DomainExceptionFilter, SharedModule and HTTP security headers"`

## 7. Glosario clínico, ADR-0001, Plop y Workflow Keep-Alive
- [ ] 7.1 Crear `Backend/docs/glosario.md`, `Backend/docs/adr/0001-clean-architecture-and-shared-kernel.md`, `Backend/plopfile.js` y `.github/workflows/db-keepalive.yml`.
- [ ] 7.2 Verificar formato con Prettier/ESLint y hacer commit: `git add Backend/docs Backend/plopfile.js .github/workflows/db-keepalive.yml && git commit -m "docs(shared): add clinical glossary, ADR-0001, plop generators and db-keepalive workflow"`

## 8. Regeneración de contrato OpenAPI y verificación final
- [ ] 8.1 Regenerar `Backend/openapi.json` (`pnpm --filter backend openapi:generate`) y ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend test:arch`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e` verificando que todos pasen en verde.
- [ ] 8.2 Hacer commit de los artefactos de OpenSpec o cambios en `openapi.json` (`git add -A && git commit -m "chore(shared): finalize B-02 shared kernel artifacts and openapi contract"`) dejando `git status` completamente limpio.

## Workflow follow-up
- Ejecutar `/opsx-sync` y `/opsx-archive` una vez completadas y verificadas todas las tareas anteriores.