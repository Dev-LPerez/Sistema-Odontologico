# Spec Delta

## Purpose
Autenticar usuarios del consultorio mediante correo y contraseña con hash Argon2, emitir y renovar sesiones seguras asociadas a un `clinicId` usando JWT y cookies `httpOnly`, y autorizar cada petición en el servidor según el rol (`ADMIN` o `AUXILIARY`).

## ADDED Requirements

### Requirement: Autenticación de usuarios con correo y contraseña
El sistema SHALL autenticar a los usuarios activos mediante correo electrónico y contraseña verificada con Argon2, retornando un `accessToken` JWT (con `sub`, `clinicId`, `role` y `email`) y estableciendo una cookie `httpOnly` con el `refreshToken` (RF-B-001, RNF-B-003, RNF-B-032).

#### Scenario: Inicio de sesión exitoso para administradora o auxiliar activa
- **GIVEN** un usuario activo registrado en un consultorio (`clinicId`) con rol `ADMIN` o `AUXILIARY`
- **WHEN** envía `POST /v1/auth/login` con su `email` y `password` válidos
- **THEN** la API responde con estado HTTP `200`, devuelve `accessToken` y los datos del usuario (`id`, `clinicId`, `email`, `fullName`, `role`), e incluye la cabecera `Set-Cookie` con `refresh_token` marcado como `HttpOnly`

#### Scenario: Rechazo de inicio de sesión por credenciales inválidas o usuario inactivo
- **GIVEN** una petición `POST /v1/auth/login` con contraseña incorrecta, correo inexistente o un usuario con `isActive = false`
- **WHEN** el sistema procesa el intento de autenticación
- **THEN** la API responde con estado HTTP `401` (`INVALID_CREDENTIALS` o `USER_INACTIVE`) sin revelar si el correo existe ni exponer hashes en logs

### Requirement: Renovación y cierre de sesión con rotación de Refresh Token
El sistema SHALL permitir renovar el `accessToken` rotando la sesión de refresco desde la cookie `httpOnly` y revocarla al cerrar sesión (RF-B-001, RNF-B-006).

#### Scenario: Renovación exitosa de sesión con cookie httpOnly válida
- **GIVEN** un cliente que posee una cookie `refresh_token` activa y no expirada
- **WHEN** envía `POST /v1/auth/refresh`
- **THEN** la API invalida el token de refresco anterior, emite una nueva cookie `refresh_token` `HttpOnly` y responde con HTTP `200` y un nuevo `accessToken`

#### Scenario: Rechazo de renovación con token revocado, expirado o ausente
- **GIVEN** un cliente sin cookie `refresh_token` o con un token ya revocado o expirado
- **WHEN** envía `POST /v1/auth/refresh`
- **THEN** la API responde con estado HTTP `401` (`INVALID_REFRESH_TOKEN`)

#### Scenario: Cierre de sesión revoca el token de refresco y limpia la cookie
- **GIVEN** un usuario con sesión activa que envía `POST /v1/auth/logout`
- **WHEN** el servidor procesa el cierre de sesión
- **THEN** la sesión de refresco queda marcada como revocada, la cookie `refresh_token` se limpia y la API responde con estado HTTP `204`

### Requirement: Control de acceso por rol y aislamiento por consultorio
El sistema SHALL evaluar en el servidor el token JWT y el rol requerido (`ADMIN` o `AUXILIARY`) en cada endpoint protegido, inyectando el `clinicId` autenticado (RF-B-002, RNF-B-004, RC-005).

#### Scenario: Consulta de perfil autenticado devuelve usuario y clinicId
- **GIVEN** un usuario autenticado con rol `ADMIN` o `AUXILIARY` y un `Bearer` token válido
- **WHEN** solicita `GET /v1/auth/me`
- **THEN** la API responde con HTTP `200` y el perfil del usuario incluyendo su `clinicId` y `role`

#### Scenario: Bloqueo de acceso cuando el rol AUXILIARY invoca una ruta exclusiva de ADMIN
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** invoca un endpoint protegido con `@Roles('ADMIN')`
- **THEN** la API rechaza la petición con estado HTTP `403` (`FORBIDDEN_ROLE`)

### Requirement: Límite de intentos de inicio de sesión
El sistema SHALL limitar la tasa de peticiones en `POST /v1/auth/login` para mitigar ataques de fuerza bruta (RNF-B-006).

#### Scenario: Exceso de intentos fallidos de login devuelve HTTP 429
- **GIVEN** un cliente que supera el umbral configurado de intentos de inicio de sesión por minuto desde la misma IP
- **WHEN** realiza un nuevo `POST /v1/auth/login`
- **THEN** la API rechaza la petición con estado HTTP `429` (`Too Many Requests`)