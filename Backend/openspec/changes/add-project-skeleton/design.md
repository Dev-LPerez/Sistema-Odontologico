# Design: add-project-skeleton

## Context
El backend del Sistema de Gestión Odontológica se desarrollará bajo Clean Architecture, NestJS, TypeScript estricto y PostgreSQL con Prisma. Este change inicial materializa el "walking skeleton" técnico: un proyecto compilable, testeable y desplegable con endpoints operativos, contenedores locales y pipeline de CI/CD que valida calidad, arquitectura y seguridad.

Restricciones clave consideradas:
- La base de datos admite máximo 20 conexiones; Prisma se limitará estrictamente a 5.
- Render y Aiven operan en capa gratuita en desarrollo y requieren keep-alive externo.
- GitHub Actions debe satisfacer el ruleset de `main` con nombres de checks exactos sin trabarse cuando no haya cambios en `Backend/`.

## Goals / Non-Goals

**Goals:**
- Estructurar el monorepo en la raíz con `pnpm-workspace.yaml` integrando `Backend` y `Frontend`.
- Configurar NestJS con TypeScript estricto, Pino (logs estructurados con `x-request-id`), Helmet, CORS, throttler y Swagger en `/docs`.
- Implementar los endpoints públicos operativos fuera de `/v1`: `GET /health` (liveness en memoria) y `GET /ready` (readiness con `SELECT 1` a PostgreSQL).
- Implementar suite e2e con Jest y Supertest probando `/health` y `/ready` primero (TDD).
- Configurar Prisma Client conectando a PostgreSQL con pool de 5 conexiones.
- Crear `docker-compose.yml` para desarrollo local con PostgreSQL (versión de Aiven, con `pg_trgm`) y MinIO (emulando S3).
- Crear `Dockerfile` multietapa optimizado con usuario no privilegiado (`node`).
- Configurar workflow `.github/workflows/backend-ci.yml` con los 4 jobs requeridos: `quality`, `test`, `build` y `security`.
- Proveer configuración de Husky, lint-staged, commitlint, `.github/dependabot.yml`, `.github/pull_request_template.md` y `render.yaml`.
- Configurar scripts en `Backend/package.json`: `lint`, `format:check`, `typecheck`, `test`, `test:cov`, `test:e2e`, `build`, `openapi:generate` y `deps:check`.

**Non-Goals:**
- Módulos de negocio clínicos (`identity`, `patients`, `clinical`, `scheduling`, `billing`, `files`, `reporting`, `audit`, `messaging`).
- Autenticación, JWT, cookies httpOnly o hashing con Argon2 (pertenecen al módulo `identity`).
- Colas en segundo plano con pg-boss.
- Adaptador real de Cloudflare R2 / S3 client en NestJS.
- Integración con Sentry.

## Decisions

### 1. Módulos y capas afectadas
- **Módulo**: `health` (`src/health/` o `src/modules/health/`) y directorio transversal `shared/`.
- **Capas afectadas**:
  - `presentation`: `health.controller.ts` exponiendo `GET /health` y `GET /ready`.
  - `infrastructure`: `prisma.service.ts` en `shared/infrastructure/prisma/` gestionando el ciclo de vida del cliente Prisma y la consulta de verificación `SELECT 1`.
- **Puertos y eventos**: No se declaran puertos de dominio en este paso al no existir agregados ni reglas de negocio clínicas; se configuran utilidades base de infraestructura.
- **Eventos de dominio**: Ninguno en este change.

### 2. Esquema de Prisma y contrato OpenAPI
- **Prisma**: Archivo `prisma/schema.prisma` básico configurando el generador `prisma-client-js` y el datasource `postgresql`. No contiene modelos clínicos en este change. Se incluye script de inicialización/migración.
- **OpenAPI**: Swagger se integra mediante `@nestjs/swagger` en `main.ts` (expuesto en `/docs` en desarrollo). Se provee el script `pnpm openapi:generate` para volcar el contrato `openapi.json` y verificar en CI que no existan discrepancias sin confirmar (RC-070).

### 3. Separación de `/health` y `/ready`
- **Decisión**:
  - `GET /health`: Comprueba que el proceso Node.js responde (liveness). Render lo utiliza como `healthCheckPath` durante el despliegue para saber cuándo enrutar tráfico sin fallar por latencia de base de datos.
  - `GET /ready`: Ejecuta `SELECT 1` sobre PostgreSQL a través de Prisma (readiness). El monitor externo (UptimeRobot / cron-job.org) apuntará aquí cada 10 minutos para mantener activos tanto el Web Service como la base de datos de Aiven.
  - Ambos endpoints se excluyen del prefijo de versión global `/v1` mediante configuración de NestJS (`setGlobalPrefix('v1', { exclude: ['health', 'ready'] })`).
- **Alternativa descartada**: Realizar consulta a la base de datos en `/health`. Si Aiven tuviese un hipo temporal de red, Render reiniciaría el contenedor innecesariamente.

### 4. Estructura del Monorepo y gestión con pnpm
- **Decisión**: Se mantiene la estructura plana actual `Backend/` y `Frontend/` en la raíz del repositorio de Git, gestionada mediante un archivo `pnpm-workspace.yaml` en la raíz.
- **Alternativa descartada**: Reestructurar a `apps/api` y `apps/web`. Mantener la raíz actual simplifica la sincronización con el directorio existente sin migraciones de carpetas.
- **Decisión meritoria de ADR**: Registrada para `docs/adr/ADR-001-monorepo-structure-and-workspaces.md`.

### 5. Jobs de CI en GitHub Actions y manejo de checks requeridos
- **Decisión**:
  - El workflow `.github/workflows/backend-ci.yml` se dispara en `push` y `pull_request` sin filtro `paths`.
  - Un job inicial `detect-changes` comprueba si hubo modificaciones en `Backend/` o archivos de configuración compartidos.
  - Los 4 jobs (`quality`, `test`, `build`, `security`) ejecutan sus tareas condicionalmente si hubo cambios en backend; si no hubo cambios, los jobs completan un paso informativo y finalizan en verde (status: success), garantizando que los checks requeridos en el ruleset de `main` no queden en estado pendiente ni bloqueen PRs del frontend.
- **Alternativa descartada**: Usar `paths` en el evento de activación de GitHub Actions, lo cual deja los status checks requeridos esperando de forma indefinida en GitHub cuando un PR solo toca `Frontend/`.

### 6. Contenedor PostgreSQL y MinIO para desarrollo local
- **Decisión**:
  - PostgreSQL 16 (alineado con la versión estándar de Aiven) en `docker-compose.yml`, con script de inicialización para crear la extensión `pg_trgm`.
  - MinIO configurado con credenciales de desarrollo y script/comando para asegurar la existencia del bucket `archivos-clinicos-dev`.
- **Alternativa descartada**: Instalar PostgreSQL nativo en la máquina host.

## Risks / Trade-offs

- **[Riesgo] Falsas alarmas o latencia en el contenedor de PostgreSQL durante las pruebas de CI**:
  → *Mitigación*: En el workflow de GitHub Actions, el servicio de PostgreSQL incluirá opciones de `healthcheck` (`pg_isready -U postgres`) con reintentos antes de dar inicio a los tests de integración.
- **[Riesgo] Consumo de memoria en Render (> 512 MB)**:
  → *Mitigación*: Dockerfile multietapa sin dependencias de desarrollo (`--prod`), eliminando caché de pnpm y ejecutando `node dist/main.js` bajo usuario no privilegiado `node`.
- **[Riesgo] Agotamiento de conexiones en Aiven (límite de 20)**:
  → *Mitigación*: Prisma Client configurado con `connection_limit=5` tanto en variables de entorno como en la inicialización del cliente.

## Migration Plan

1. Inicialización de dependencias y archivos de configuración en la raíz del repositorio y en `Backend/`.
2. Verificación local con `docker compose up -d` y ejecución de la suite de pruebas.
3. Creación y ejecución del pipeline de CI en una rama previa a la activación de los checks obligatorios en GitHub.
