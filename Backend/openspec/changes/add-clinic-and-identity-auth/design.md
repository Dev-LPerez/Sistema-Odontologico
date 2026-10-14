# Design

## Context
Con `SharedModule` activo (`ClockPort`, `IdGeneratorPort`, `UnitOfWorkPort`, `DomainError` y `DomainExceptionFilter`), el backend necesita el módulo `modules/identity` para cumplir con RNF-B-032 (`clinicId` obligatorio en todas las tablas desde el inicio) y proveer autenticación y autorización por roles (`ADMIN` y `AUXILIARY`). Ver `proposal.md` para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Crear las tablas iniciales en Prisma (`Clinic`, `User`, `RefreshSession`) con `clinicId` obligatorio.
- Implementar Clean Architecture de 4 capas en `Backend/src/modules/identity/` sin acoplar `domain` ni `application` a Nest, Passport, Argon2 ni Prisma.
- Proveer `JwtAuthGuard`, `RolesGuard` y los decoradores `@Roles()`, `@Public()`, `@CurrentUser()` y `@CurrentClinic()` reutilizables por todos los módulos futuros.
- Verificar la equivalencia entre repositorios `InMemory` y `Prisma` con una suite de pruebas de contrato (`RC-018`).

**Non-Goals:**
- El CRUD administrativo de usuarios (crear/editar/desactivar auxiliares) y la actualización de la configuración del consultorio corresponden a **B-04 (`add-user-and-clinic-management`)**.
- Recuperación de contraseña por correo y 2FA están fuera del MVP (RF-B-004, RF-B-005).

## Decisions

1. **Modelo de datos en Prisma (`schema.prisma`):**
   - *Decisión:* Definir el enum `UserRole { ADMIN AUXILIARY }` y tres modelos:
     - `Clinic`: `id` (UUID), `name`, `address`, `phone`, `email`, `logoUrl`, `settings` (`Json?`), `createdAt`, `updatedAt`.
     - `User`: `id` (UUID), `clinicId` (FK a `Clinic`), `email` (único), `passwordHash`, `fullName`, `role` (`UserRole`), `isActive` (`Boolean`, default `true`), `createdAt`, `updatedAt`. Índice en `[clinicId, role]`.
     - `RefreshSession`: `id` (UUID), `clinicId` (FK a `Clinic`), `userId` (FK a `User`), `tokenHash` (único), `expiresAt`, `revokedAt` (`DateTime?`), `createdAt`. Índice en `[userId, revokedAt]`.
   - *Alternativa descartada:* Guardar el `refreshToken` en texto plano en la base de datos. Almacenar su hash SHA-256 (`tokenHash`) evita que una filtración de lectura permita secuestrar sesiones.

2. **Puertos de aplicación `PasswordHasherPort` y `TokenServicePort`:**
   - *Decisión:* `LoginUseCase` y `RefreshSessionUseCase` dependen de `PasswordHasherPort` (`hash`, `verify`) y `TokenServicePort` (`signAccessToken`, `verifyAccessToken`, `generateRefreshToken`, `hashRefreshToken`). En infraestructura se implementan con `argon2` (`argon2id`) y `@nestjs/jwt` + `crypto.createHash('sha256')`.
   - *Alternativa descartada:* Invocar `argon2.verify` o `JwtService` directamente en los casos de uso, lo que violaría RC-012 y RC-016.

3. **Transporte híbrido de tokens (Access Token en JSON + Refresh Token en Cookie `httpOnly`):**
   - *Decisión:* `POST /v1/auth/login` y `POST /v1/auth/refresh` devuelven el `accessToken` de corta duración (15 min) en el cuerpo JSON (para que el cliente OpenAPI lo envíe en `Authorization: Bearer <token>`) y colocan el `refreshToken` (7 días) en la cookie `refresh_token` con `httpOnly: true`, `sameSite: 'lax'` (`'none'` + `secure: true` en producción) y `path: '/v1/auth'`.
   - *Justificación:* Protege el token de renovación contra ataques XSS en el navegador del iPad (RNF-B-003, RNF-F-044).

4. **Decoradores y Guards transversales:**
   - *Decisión:* Exponer `@CurrentUser()`, `@CurrentClinic()`, `@Roles(...)` y `@Public()` en `shared/presentation/decorators/` y `JwtAuthGuard` + `RolesGuard` en `shared/presentation/guards/` (o re-exportados en el `index.ts` público de `identity`) para que los demás módulos (`patients`, `clinical`, etc.) no tengan que acoplarse a detalles internos de `identity`.
   - *ADR:* No requiere un nuevo ADR separado porque ya está contemplado en la sección 3.5 del documento de arquitectura y en ADR-0001.

## Risks / Trade-offs
- **[Risk] Lentitud de Argon2 en pruebas unitarias de casos de uso** → *Mitigación:* Las pruebas de casos de uso inyectan un doble `FakePasswordHasher` determinista e instantáneo; `Argon2PasswordHasherAdapter` se prueba en su propia especificación unitaria.
- **[Risk] Bloqueo de `/health` y `/ready` si `JwtAuthGuard` se registra globalmente sin exclusión** → *Mitigación:* Marcar `/health`, `/ready`, `/v1/auth/login` y `/v1/auth/refresh` con el decorador `@Public()` (o aplicar `JwtAuthGuard` y `RolesGuard` en los controladores `/v1` respetando la metadata `IS_PUBLIC_KEY`).