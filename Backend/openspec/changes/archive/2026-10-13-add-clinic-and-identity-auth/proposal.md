# Proposal

## Why
Con el Kernel Compartido (`shared/`) ya operativo, el siguiente paso crítico es construir el módulo `identity` para establecer la entidad raíz `Clinic` (garantizando que toda tabla lleve `clinicId` desde el inicio), autenticar usuarios con correo y contraseña hasheada con Argon2, gestionar sesiones mediante JWT y cookies `httpOnly`, e imponer control de acceso por rol (`ADMIN` y `AUXILIARY`) en el servidor.

- **Requisitos cubiertos:** RF-B-001, RF-B-002, RNF-B-003, RNF-B-004, RNF-B-006, RNF-B-032, RC-005, RC-018, RC-074.
- **Change equivalente en Frontend:** `add-auth-and-role-navigation`.

## What Changes
- Crear la migración inicial de Prisma con los modelos `Clinic`, `User` (roles `ADMIN` y `AUXILIARY`) y `RefreshSession`, todos vinculados a `clinicId`.
- Implementar la capa `domain` de `modules/identity`: entidades `Clinic`, `User`, `RefreshSession`, objeto de valor `Email`, errores de dominio y puertos de repositorio.
- Implementar la capa `application`: puertos `PasswordHasherPort` y `TokenServicePort`, casos de uso `LoginUseCase`, `RefreshSessionUseCase`, `LogoutUseCase` y consulta `GetAuthenticatedUserQuery`.
- Implementar la capa `infrastructure`: adaptadores `Argon2PasswordHasherAdapter`, `JwtTokenServiceAdapter`, repositorios `Prisma` e `InMemory` con suite de pruebas de contrato (`RC-018`).
- Implementar la capa `presentation`: `AuthController` (`/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout`, `/v1/auth/me`), `JwtAuthGuard`, `RolesGuard` y decoradores `@Roles()`, `@Public()`, `@CurrentUser()` y `@CurrentClinic()`.

## Capabilities

### New Capabilities
- `identity-auth`: Autenticación con correo y contraseña (Argon2), emisión de `accessToken` JWT con `clinicId` y `role`, rotación y revocación de sesiones mediante cookie `httpOnly`, y autorización en servidor por roles (`ADMIN` y `AUXILIARY`).

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/prisma/schema.prisma`, `Backend/src/modules/identity/`, `Backend/src/shared/presentation/`, `Backend/src/app.module.ts`, `Backend/src/main.ts`, `Backend/openapi.json`.
- **Dependencias nuevas:** `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `argon2`, `cookie-parser` (y `@types/passport-jwt`, `@types/cookie-parser`).