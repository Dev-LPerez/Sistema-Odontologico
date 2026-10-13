# Spec: system-health

## Purpose

Provee endpoints operativos públicos de comprobación de salud y preparación del sistema (/health y /ready) para orquestadores, despliegues y monitores de disponibilidad externos.

## Requirements

### Requirement: Liveness probe endpoint
El sistema SHALL exponer un endpoint público `GET /health` fuera del prefijo `/v1` que verifique que el proceso del servidor HTTP está activo y recibiendo peticiones sin consultar servicios externos.

#### Scenario: Verificación exitosa de liveness
- **DADO** que la instancia de la API está en ejecución y saludable
- **CUANDO** se realiza una petición HTTP `GET /health`
- **ENTONCES** el sistema responde con código HTTP 200 (OK), cabecera `Content-Type: application/json` y un cuerpo indicando estado operativo `{"status": "ok"}`.

#### Scenario: Acceso público sin autenticación para liveness
- **DADO** cualquier cliente, orquestador de contenedores o monitor externo
- **CUANDO** solicita `GET /health` sin proveer cabeceras de autorización ni tokens de sesión
- **ENTONCES** el sistema no exige autenticación ni restringe el acceso por rol y responde con código HTTP 200 (OK).

### Requirement: Readiness probe endpoint
El sistema SHALL exponer un endpoint público `GET /ready` fuera del prefijo `/v1` que verifique la conectividad y disponibilidad de la base de datos PostgreSQL ejecutando una consulta trivial.

#### Scenario: Verificación exitosa de preparación con base de datos disponible
- **DADO** que la base de datos PostgreSQL está accesible y respondiendo consultas
- **CUANDO** se realiza una petición HTTP `GET /ready`
- **ENTONCES** el sistema ejecuta una verificación de conectividad (`SELECT 1`), responde con código HTTP 200 (OK) y un cuerpo `{"status": "ready", "database": "up"}`.

#### Scenario: Falla de preparación cuando la base de datos no está disponible
- **DADO** que la base de datos PostgreSQL no responde o la conexión ha fallado
- **CUANDO** se realiza una petición HTTP `GET /ready`
- **ENTONCES** el sistema captura la excepción sin exponer detalles internos de infraestructura o credenciales, responde con código HTTP 503 (Service Unavailable) y un cuerpo `{"status": "down", "database": "down"}`.

#### Scenario: Acceso público sin restricción de rol para monitoreo de base de datos
- **DADO** un monitor de disponibilidad externo (UptimeRobot o cron-job.org)
- **CUANDO** envía una petición HTTP `GET /ready` para mantener activa la instancia y la base de datos
- **ENTONCES** el sistema procesa la comprobación sin requerir autenticación ni roles clínicos.

### Requirement: Exclusión de prefijo de versión y trazabilidad
El sistema SHALL servir las rutas `/health` y `/ready` directamente en la raíz del servidor fuera del prefijo global `/v1`, aplicando cabeceras seguras e inyectando un identificador de correlación en la respuesta.

#### Scenario: Rutas operativas fuera del prefijo de versión de negocio
- **DADO** el servidor configurado con prefijo global `/v1` para la API de negocio
- **CUANDO** se realiza una petición a `/health` o `/ready`
- **ENTONCES** las rutas son resueltas en la raíz del dominio sin requerir `/v1/health` ni `/v1/ready`.

#### Scenario: Inclusión de identificador de correlación y cabeceras de seguridad
- **DADO** una petición entrante a cualquiera de los endpoints operativos
- **CUANDO** el servidor procesa la respuesta
- **ENTONCES** incluye cabeceras de seguridad HTTP y propaga la cabecera `x-request-id` asociada a los registros de logs estructurados.
