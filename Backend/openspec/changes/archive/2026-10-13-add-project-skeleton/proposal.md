# Proposal: add-project-skeleton

## Why
El proyecto requiere una base técnica sólida, automatizada y reproducible ("walking skeleton") antes de construir módulos de negocio. Establecer el proyecto NestJS, contenedores, endpoints operativos, conexión a base de datos y un pipeline estricto de CI/CD en GitHub Actions y Render previene problemas de integración tempranos y asegura el cumplimiento de los estándares de calidad arquitectónicos y de seguridad.

Este cambio es exclusivo de backend e infraestructura; no toca la interfaz ni requiere un change pareja en `Frontend`.

Requisitos cubiertos:
- **RNF-B**: RNF-B-001, RNF-B-005, RNF-B-006, RNF-B-009, RNF-B-040, RNF-B-041, RNF-B-042, RNF-B-043, RNF-B-045.
- **RC**: RC-001, RC-002, RC-010, RC-011, RC-012, RC-013, RC-020, RC-021, RC-050, RC-052, RC-061, RC-070, RC-071, RC-073, RC-074, RC-075.

## What Changes
- **Monorepo y Tooling raíz**: Configuración de `pnpm-workspace.yaml` (Backend y Frontend), Husky, lint-staged, commitlint y revisión de `.gitignore`.
- **Estructura Backend**: Inicialización de NestJS con TypeScript estricto, módulo `health`, carpeta `shared/`, validación de variables de entorno, middleware de correlación con Pino, Helmet, CORS, throttler y Swagger en `/docs`.
- **Persistencia**: Conexión de Prisma Client a PostgreSQL limitando el pool de conexiones a 5 y script base de migración.
- **Entorno de Contenedores**: Dockerfile multietapa optimizado y `docker-compose.yml` para desarrollo local con PostgreSQL (versión Aiven con extensión `pg_trgm`) y MinIO.
- **Pipeline CI/CD**: Workflow `.github/workflows/backend-ci.yml` con jobs exactos `quality`, `test`, `build` y `security` ejecutados condicionalmente si cambia `Backend/`. Plantilla de PR (`.github/pull_request_template.md`), configuración de Dependabot (`.github/dependabot.yml`) y manifiesto `render.yaml` (rootDir `Backend`, healthCheck `/health`).

## Capabilities

### New Capabilities
- `system-health`: Endpoints operativos de observabilidad: `GET /health` (liveness ligero sin base de datos) y `GET /ready` (readiness con comprobación `SELECT 1` en PostgreSQL), ambos fuera del prefijo `/v1`.

### Modified Capabilities
<!-- Ninguna capacidad previa modificada. -->

## Impact
- Nueva estructura de código en `Backend/` y configuración de CI/CD en la raíz del repositorio (`.github/`, root configs).
- Nuevos scripts de verificación en `Backend/package.json`: `lint`, `format:check`, `typecheck`, `test`, `test:cov`, `test:e2e`, `build`, `openapi:generate` y `deps:check`.
- Sin impacto en contratos clínicos ni lógica de negocio previa.
