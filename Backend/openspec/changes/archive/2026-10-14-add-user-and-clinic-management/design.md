# Design

## Context
El cambio `add-clinic-and-identity-auth` (B-03) dejó creadas las tablas `clinics`, `users` y `refresh_sessions` junto con la autenticación JWT y los guards de roles. Falta completar el módulo `modules/identity` con la administración de usuarios del consultorio (`RF-B-003`) y la configuración del perfil del consultorio (`RF-B-141`). Ver `proposal.md` para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Permitir al rol `ADMIN` crear, listar, editar y activar/desactivar usuarios dentro de su `clinicId`.
- Garantizar que al desactivar un usuario se revoquen atómicamente todas sus sesiones de refresco mediante `UnitOfWorkPort`.
- Permitir consultar (`ADMIN` y `AUXILIARY`) y actualizar (`ADMIN`) el perfil y `settings` JSON del consultorio (`Clinic`).
- Mantener la suite de contrato (`RC-018`) y pruebas E2E de permisos por rol (`RC-005`).

**Non-Goals:**
- Subida directa de archivo binario del logo a Cloudflare R2 (se abordará en `modules/files`; aquí `logoUrl` recibe la URL o ruta del recurso).
- Creación de múltiples consultorios desde la API pública (el MVP opera por consultorio autenticado mediante `@CurrentClinic()`).

## Decisions

1. **Separación de casos de uso (SRP y RC-015):**
   - *Decisión:* Crear clases independientes con un único método `execute`:
     - `CreateUserUseCase`: valida unicidad de `Email`, hashea contraseña con `PasswordHasherPort` y guarda `User` en el `clinicId` actual.
     - `UpdateUserUseCase`: actualiza `fullName`, `email` (verificando colisión si cambia), `role` y opcionalmente `password`.
     - `ChangeUserStatusUseCase`: verifica que `targetUserId !== actorUserId` al desactivar (`CannotDeactivateSelfError`, categoría `INVARIANT_VIOLATION` 422) y ejecuta dentro de `UnitOfWorkPort` la actualización del usuario y `refreshSessionRepo.revokeAllForUser(targetUser.id, now)`.
     - `ListClinicUsersQuery`: retorna los usuarios del `clinicId` ordenados por fecha de creación.
     - `GetClinicProfileQuery` y `UpdateClinicProfileUseCase`: leen y actualizan la entidad `Clinic` validando que `name` no sea vacío (`InvalidClinicNameError`, categoría `VALIDATION` 400).
   - *Alternativa descartada:* Agrupar todas las operaciones en un `UserService` o `ClinicService`, lo cual viola RC-015.

2. **Extensión mínima de `UserRepositoryPort` (ISP):**
   - *Decisión:* Añadir únicamente `findAllByClinicId(clinicId: string): Promise<User[]>` a `UserRepositoryPort` (quedando con 4 métodos en total, bajo el límite de 5 métodos de la sección 3.3).

3. **Rutas REST y Contrato OpenAPI:**
   - *Decisión:*
     - `UsersController` (`/v1/users`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles('ADMIN')`): `GET /v1/users`, `POST /v1/users`, `PATCH /v1/users/:id` y `PATCH /v1/users/:id/status`.
     - `ClinicController` (`/v1/clinic`, `@UseGuards(JwtAuthGuard, RolesGuard)`): `GET /v1/clinic` (`@Roles('ADMIN', 'AUXILIARY')`) y `PATCH /v1/clinic` (`@Roles('ADMIN')`).
   - *ADR:* No requiere nuevo ADR porque sigue fielmente ADR-0001.

## Risks / Trade-offs
- **[Risk] Un usuario recién desactivado intenta renovar su sesión con su cookie `refresh_token`** → *Mitigación:* `ChangeUserStatusUseCase` revoca todas las sesiones del usuario en la misma transacción (`UnitOfWorkPort`) y además `RefreshSessionUseCase` ya verifica `user.isActive`.
- **[Risk] Administradora se desactiva accidentalmente a sí misma dejando al consultorio sin acceso administrativo** → *Mitigación:* Regla explícita que lanza `CannotDeactivateSelfError` (HTTP `422`) cuando `actorUserId === targetUserId` y `isActive === false`.