# Tasks

## 1. Dependencias y esquema Prisma inicial

- [x] 1.1 Instalar en `Backend/package.json` las dependencias de producción (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `argon2`, `cookie-parser`) y de desarrollo (`@types/passport-jwt`, `@types/cookie-parser`).
- [x] 1.2 Definir en `Backend/prisma/schema.prisma` el enum `UserRole` (`ADMIN`, `AUXILIARY`) y los modelos `Clinic`, `User` y `RefreshSession` (todos con `clinicId`), generar la migración inicial en `Backend/prisma/migrations/` y ejecutar `pnpm --filter backend prisma:generate` verificando que compile sin errores.
- [x] 1.3 Ejecutar `pnpm --filter backend typecheck` y confirmar con un commit: `git add Backend/package.json pnpm-lock.yaml Backend/prisma && git commit -m "feat(identity): add auth dependencies and initial Clinic, User and RefreshSession schema"`

## 2. Capa domain de identity con TDD

- [x] 2.1 Escribir las pruebas unitarias en rojo en `Backend/src/modules/identity/domain/` para el objeto de valor `email.vo.spec.ts` y las entidades `clinic.entity.spec.ts`, `user.entity.spec.ts` y `refresh-session.entity.spec.ts` (validando formato de correo, usuario inactivo, expiración y revocación de sesión).
- [x] 2.2 Implementar `role.enum.ts`, `email.vo.ts`, `clinic.entity.ts`, `user.entity.ts`, `refresh-session.entity.ts`, `identity.errors.ts` (`InvalidCredentialsError`, `UserInactiveError`, `InvalidRefreshTokenError`, `ForbiddenRoleError` heredando de `DomainError`) y los puertos `clinic.repository.port.ts`, `user.repository.port.ts` y `refresh-session.repository.port.ts` (importando de `@shared/domain/...` para respetar `.dependency-cruiser.js`).
- [x] 2.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/identity/domain && git commit -m "feat(identity): add Clinic, User and RefreshSession domain entities and repository ports"`

## 3. Capa application de identity (Casos de Uso) con TDD

- [x] 3.1 Definir los puertos `password-hasher.port.ts` (`PASSWORD_HASHER_PORT`) y `token-service.port.ts` (`TOKEN_SERVICE_PORT`) en `Backend/src/modules/identity/application/ports/`.
- [x] 3.2 Escribir las pruebas unitarias en rojo `login.use-case.spec.ts`, `refresh-session.use-case.spec.ts`, `logout.use-case.spec.ts` y `get-authenticated-user.query.spec.ts` usando dobles en memoria, `ClockPort` fijo e `IdGeneratorPort` determinista.
- [x] 3.3 Implementar `login.use-case.ts`, `refresh-session.use-case.ts`, `logout.use-case.ts` y `get-authenticated-user.query.ts` (un único método público `execute` por clase, RC-015) hasta pasar todas las pruebas en verde con cobertura >= 90%.
- [x] 3.4 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/identity/application && git commit -m "feat(identity): implement Login, RefreshSession, Logout and GetAuthenticatedUser use cases"`

## 4. Adaptadores de infraestructura y suite de contrato (RC-018)

- [x] 4.1 Escribir las pruebas unitarias en rojo `argon2-password-hasher.adapter.spec.ts` y `jwt-token-service.adapter.spec.ts`, e implementar `argon2-password-hasher.adapter.ts` y `jwt-token-service.adapter.ts` en `Backend/src/modules/identity/infrastructure/adapters/`.
- [x] 4.2 Implementar los repositorios `in-memory-clinic.repository.ts`, `in-memory-user.repository.ts`, `in-memory-refresh-session.repository.ts` y sus contrapartes `prisma-clinic.repository.ts`, `prisma-user.repository.ts` y `prisma-refresh-session.repository.ts` con sus mapeadores, y crear la suite de contrato `identity-repositories.contract.spec.ts` (RC-018).
- [x] 4.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/identity/infrastructure && git commit -m "feat(identity): implement Argon2, JWT and Prisma/InMemory repositories with contract tests"`

## 5. Guards, decoradores, AuthController y pruebas E2E (RC-005)

- [x] 5.1 Escribir las pruebas unitarias en rojo para `jwt-auth.guard.spec.ts` y `roles.guard.spec.ts`, e implementar los decoradores `@Public()`, `@Roles()`, `@CurrentUser()` y `@CurrentClinic()` y los guards `JwtAuthGuard` y `RolesGuard` en `Backend/src/shared/presentation/`.
- [x] 5.2 Implementar los DTOs con `class-validator` y `@nestjs/swagger` (`login.dto.ts`, `auth-response.dto.ts`), el controlador `auth.controller.ts` (`/v1/auth/login` con `@Throttle`, `/v1/auth/refresh`, `/v1/auth/logout`, `/v1/auth/me` y un endpoint o ruta protegida por rol para verificar `ADMIN` vs `AUXILIARY`), `identity.module.ts` e `index.ts` público, y registrar `cookieParser()` e `IdentityModule` en `main.ts` y `app.module.ts`.
- [x] 5.3 Escribir y ejecutar la suite E2E `Backend/test/auth.e2e-spec.ts` probando login exitoso, credenciales inválidas, usuario inactivo, cookie `httpOnly` en refresh y logout, acceso a `/v1/auth/me` y bloqueo `403` para rol `AUXILIARY` en ruta exclusiva de `ADMIN` (RC-005).
- [x] 5.4 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test` y `pnpm --filter backend test:e2e` en verde, y hacer commit: `git add Backend/src Backend/test && git commit -m "feat(identity): add AuthController, JWT/Roles guards, decorators and E2E role tests"`

## 6. Regeneración del contrato OpenAPI y cierre del change

- [x] 6.1 Regenerar `Backend/openapi.json` (`pnpm --filter backend openapi:generate`) verificando que los endpoints `/v1/auth/*` y el esquema `bearer` aparezcan documentados, y ejecutar `pnpm --filter backend test:cov` validando cobertura >= 90% en `domain`/`application` y >= 80% global.
- [x] 6.2 Confirmar los cambios del contrato OpenAPI y el estado de `tasks.md` con un commit: `git add -A && git commit -m "chore(identity): regenerate openapi.json and complete B-03 tasks"` dejando `git status` limpio.

## Workflow follow-up

- Ejecutar `/opsx-sync` y `/opsx-archive` una vez completadas todas las tareas y verificaciones anteriores.