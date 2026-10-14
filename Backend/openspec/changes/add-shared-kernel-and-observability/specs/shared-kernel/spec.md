# Spec Delta

## Purpose
Proveer las abstracciones transversales del Kernel Compartido (errores de dominio, agregados, reloj en zona horaria de Colombia, generador de identificadores, transacciones atómicas y bus de eventos) junto con la traducción HTTP uniforme, trazabilidad por petición y redacción estricta de datos clínicos en logs y monitoreo.

## ADDED Requirements

### Requirement: Traducción uniforme de errores de dominio a respuestas HTTP
El sistema SHALL traducir cualquier error heredado de `DomainError` a una respuesta JSON uniforme con el código HTTP de su categoría (`VALIDATION` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `INVARIANT_VIOLATION` 422), incluyendo `correlationId` y sin exponer trazas internas para cualquier rol (`ADMIN`, `AUXILIARY` o anónimo).

#### Scenario: Error de conflicto de dominio devuelve HTTP 409 con estructura estándar
- **GIVEN** una petición HTTP procesada con `correlationId` `"corr-123"`
- **WHEN** un caso de uso lanza un `DomainError` con categoría `CONFLICT` y código `"DUPLICATE_RESOURCE"`
- **THEN** la API responde con estado HTTP `409` y cuerpo JSON con `statusCode`, `errorCode`, `message`, `correlationId` y `timestamp`

#### Scenario: Regla de dominio rechaza operación por permiso o invariante
- **GIVEN** un usuario autenticado con rol `AUXILIARY` o `ADMIN`
- **WHEN** el dominio lanza un `DomainError` con categoría `FORBIDDEN` o `INVARIANT_VIOLATION`
- **THEN** la API responde con estado HTTP `403` o `422` sin filtrar trazas internas ni datos clínicos

### Requirement: Manejo determinista de fechas en UTC y zona horaria America/Bogota
El sistema SHALL almacenar todas las fechas en UTC y evaluar el día calendario local según la zona horaria `America/Bogota` (UTC-5) mediante `ClockPort` (RNF-B-045, RC-054).

#### Scenario: Instante UTC nocturno evaluado en el día calendario correcto de Colombia
- **GIVEN** el instante UTC `"2026-10-14T03:30:00.000Z"` equivalente a las `22:30` del `2026-10-13` en Bogotá
- **WHEN** se formatea la fecha en Bogotá y se compara su día calendario con `"2026-10-13T15:00:00.000Z"`
- **THEN** el sistema devuelve `"2026-10-13"` y confirma que ambos instantes pertenecen al mismo día en Colombia (`true`)

### Requirement: Ejecución transaccional atómica mediante UnitOfWorkPort
El sistema SHALL ejecutar bloques de persistencia dentro de una transacción atómica mediante `UnitOfWorkPort` sin exponer tipos de Prisma fuera de `infrastructure` (RC-012).

#### Scenario: Reversión automática cuando falla una operación intermedia
- **GIVEN** una operación compuesta ejecutada dentro de `UnitOfWorkPort`
- **WHEN** una de las operaciones intermedias lanza una excepción de dominio o infraestructura
- **THEN** todos los cambios previos dentro del bloque se revierten en la base de datos y la excepción original se propaga

### Requirement: Trazabilidad con Correlation ID y redacción de datos clínicos
El sistema SHALL asignar y devolver la cabecera `x-correlation-id` en toda respuesta HTTP, y SHALL redactar credenciales y datos clínicos en los logs JSON y en los eventos enviados a Sentry (RNF-B-009, RC-023, RC-060, RC-061).

#### Scenario: Generación y retorno de x-correlation-id en peticiones HTTP
- **GIVEN** un cliente que realiza una petición `GET /health` sin enviar la cabecera `x-correlation-id`
- **WHEN** el servidor procesa la petición
- **THEN** la respuesta incluye la cabecera `x-correlation-id` con un UUID válido y el log registra ese mismo identificador

#### Scenario: Redacción automática de datos clínicos y credenciales en logs y Sentry
- **GIVEN** un payload o evento de error que contiene `password`, `authorization`, `diagnosis`, `privateNotes`, `findings` u `odontogram`
- **WHEN** el logger serializa el registro o el sanitizador de Sentry procesa el evento antes de enviarlo
- **THEN** todos esos campos son reemplazados por `"[REDACTED]"` y ningún dato clínico queda expuesto en texto plano