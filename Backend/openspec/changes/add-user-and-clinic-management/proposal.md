# Proposal

## Why
Con la autenticación y el control de acceso por roles (`ADMIN` y `AUXILIARY`) ya operativos en `modules/identity`, es necesario que la doctora (administradora) pueda gestionar las cuentas de usuario de su consultorio (crear, listar, editar y activar/desactivar auxiliares) y configurar los datos base del consultorio (nombre, logo, dirección, teléfono, correo, horarios y textos de plantillas) que se usarán en historias clínicas, cotizaciones y consentimientos.

- **Requisitos cubiertos:** RF-B-003, RF-B-141, RNF-B-003, RNF-B-004, RNF-B-032, RC-005, RC-015, RC-018, RC-074.
- **Change equivalente en Frontend:** `add-auth-and-role-navigation` y `add-patients-and-catalogs-ui`.

## What Changes
- Extender la capa `domain` de `modules/identity`: métodos de actualización de perfil en `User`, validación de nombre no vacío en `Clinic`, errores de dominio (`DuplicateUserEmailError`, `CannotDeactivateSelfError`, `InvalidClinicNameError`) y método `findAllByClinicId` en `UserRepositoryPort`.
- Implementar en `application` los casos de uso y consultas de gestión de usuarios: `CreateUserUseCase`, `UpdateUserUseCase`, `ChangeUserStatusUseCase` (revocando todas las sesiones activas al desactivar dentro de `UnitOfWorkPort`) y `ListClinicUsersQuery`.
- Implementar en `application` la gestión del consultorio: `GetClinicProfileQuery` y `UpdateClinicProfileUseCase`.
- Actualizar los repositorios `InMemoryUserRepository` y `PrismaUserRepository` junto con la suite de pruebas de contrato (`RC-018`).
- Exponer `UsersController` (`/v1/users`, exclusivo para `ADMIN`) y `ClinicController` (`GET /v1/clinic` para `ADMIN` y `AUXILIARY`; `PATCH /v1/clinic` exclusivo para `ADMIN`) con pruebas E2E de permisos por rol (`RC-005`).

## Capabilities

### New Capabilities
- `user-and-clinic-management`: Administración de usuarios del consultorio (creación con Argon2, edición, listado y activación/desactivación con revocación de sesiones) y consulta/configuración del perfil del consultorio (`Clinic`).

### Modified Capabilities
*(Ninguna)*

## Impact
- **Código afectado:** `Backend/src/modules/identity/`, `Backend/test/users-and-clinic.e2e-spec.ts`, `Backend/openapi.json`.
- **Esquema Prisma:** Sin migraciones adicionales (las tablas `clinics` y `users` ya cuentan con las columnas necesarias).