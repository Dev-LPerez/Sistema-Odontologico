# user-and-clinic-management Specification

## Purpose
Permitir a la administradora gestionar los usuarios de su consultorio (crear, listar, editar y activar o desactivar cuentas revocando sus sesiones activas) y configurar los datos e identidad del consultorio (`Clinic`).

## Requirements

### Requirement: Creación y listado de usuarios del consultorio por la administradora
El sistema SHALL permitir exclusivamente al rol `ADMIN` crear nuevos usuarios (`ADMIN` o `AUXILIARY`) con contraseña hasheada en Argon2 y listar los usuarios pertenecientes a su `clinicId` sin exponer `passwordHash` (RF-B-003, RNF-B-003, RNF-B-004, RNF-B-032).

#### Scenario: Administradora crea una cuenta de auxiliar exitosamente
- **GIVEN** una usuaria autenticada con rol `ADMIN` en el consultorio `"clinic-123"`
- **WHEN** envía `POST /v1/users` con `email`, `password`, `fullName` y `role: "AUXILIARY"`
- **THEN** la API responde con estado HTTP `201` y devuelve el usuario creado con `isActive: true` y `clinicId: "clinic-123"` sin incluir `passwordHash`

#### Scenario: Rechazo de creación de usuario por correo duplicado
- **GIVEN** un correo electrónico que ya está registrado por otro usuario
- **WHEN** la administradora envía `POST /v1/users` con ese mismo `email`
- **THEN** la API responde con estado HTTP `409` (`DUPLICATE_USER_EMAIL`)

#### Scenario: Bloqueo a rol AUXILIARY al intentar listar o crear usuarios
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** solicita `GET /v1/users` o `POST /v1/users`
- **THEN** la API rechaza la petición con estado HTTP `403` (`FORBIDDEN_ROLE`)

### Requirement: Edición y activación o desactivación de usuarios con revocación de sesiones
El sistema SHALL permitir al rol `ADMIN` editar los datos de un usuario de su consultorio y cambiar su estado `isActive`, revocando todas sus sesiones de refresco activas al desactivarlo e impidiendo que la administradora se desactive a sí misma (RF-B-003, RNF-B-004).

#### Scenario: Administradora desactiva una auxiliar y sus sesiones quedan revocadas
- **GIVEN** una auxiliar activa con sesiones de refresco vigentes en el consultorio de la administradora
- **WHEN** la administradora envía `PATCH /v1/users/:id/status` con `{ "isActive": false }`
- **THEN** la API responde con HTTP `200`, el usuario pasa a `isActive: false` y sus sesiones de refresco quedan revocadas inmediatamente

#### Scenario: Rechazo cuando la administradora intenta desactivar su propia cuenta
- **GIVEN** una administradora autenticada con `id` `"user-admin-1"`
- **WHEN** envía `PATCH /v1/users/user-admin-1/status` con `{ "isActive": false }`
- **THEN** la API responde con estado HTTP `422` (`CANNOT_DEACTIVATE_SELF`)

### Requirement: Consulta y actualización del perfil del consultorio
El sistema SHALL permitir a cualquier usuario autenticado (`ADMIN` o `AUXILIARY`) consultar el perfil de su consultorio en `GET /v1/clinic`, y exclusivamente al rol `ADMIN` actualizarlo en `PATCH /v1/clinic` (RF-B-141, RNF-B-004, RC-005).

#### Scenario: Actualización exitosa de datos y plantillas del consultorio por ADMIN
- **GIVEN** una usuaria autenticada con rol `ADMIN`
- **WHEN** envía `PATCH /v1/clinic` con `name`, `address`, `phone`, `email`, `logoUrl` y `settings` (horarios y textos de plantillas)
- **THEN** la API actualiza el consultorio autenticado y responde con estado HTTP `200` y el perfil completo actualizado

#### Scenario: Rol AUXILIARY puede consultar el consultorio pero no modificarlo
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** solicita `GET /v1/clinic` recibe HTTP `200`, pero cuando envía `PATCH /v1/clinic`
- **THEN** la API rechaza la modificación con estado HTTP `403` (`FORBIDDEN_ROLE`)
