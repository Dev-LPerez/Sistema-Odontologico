# Tasks: add-project-skeleton

## 1. Configuración de Raíz, Monorepo y Git Tooling

- [x] 1.1 Configurar `pnpm-workspace.yaml` en la raíz del repositorio incluyendo `Backend` y `Frontend`, y actualizar `.gitignore` raíz para ignorar `node_modules`, `dist`, `.env` y `.env.*` (salvo `.env.example`), verificando con `git status`.
- [x] 1.2 Configurar Commitlint, Husky y lint-staged en la raíz del repositorio para forzar Conventional Commits (RC-074), verificando con commit de prueba.
- [x] 1.3 Crear `.github/dependabot.yml` configurando actualizaciones semanales para npm, docker y github-actions, y crear `.github/pull_request_template.md` exigiendo el enlace al ID de requisito (RC-073).
- [x] 1.4 Crear el manifiesto `render.yaml` en la raíz especificando `rootDir: Backend`, runtime `docker`, plan gratuito y `healthCheckPath: /health`.

## 2. Inicialización del Backend, Dependencias y Scripts

- [x] 2.1 Inicializar el proyecto NestJS en `Backend/` con TypeScript en modo estricto, configurando `Backend/package.json` con los scripts requeridos (`lint`, `format:check`, `typecheck`, `test`, `test:cov`, `test:e2e`, `build`, `openapi:generate`, `deps:check`), verificando que `pnpm install` instale sin advertencias.
- [x] 2.2 Configurar ESLint y Prettier en `Backend/`, verificando con `pnpm lint` y `pnpm format:check` en verde (RC-010).
- [x] 2.3 Configurar Jest con los umbrales de cobertura obligatorios (80 % global y 90 % en domain y application) y scripts de prueba en `package.json`, verificando con `pnpm test`.
- [x] 2.4 Configurar `.dependency-cruiser.js` para validar la regla de dependencia de Clean Architecture (domain sin dependencias de framework/infraestructura) y verificar con `pnpm deps:check` (RC-012).

## 3. Infraestructura Local: Docker, MinIO y Persistencia con Prisma

- [x] 3.1 Crear `docker-compose.yml` en `Backend/` configurando PostgreSQL 16 (con script de inicialización para extensión `pg_trgm`) y MinIO (puertos 9000/9001 con creación de bucket de desarrollo), verificando con `docker compose up -d`.
- [x] 3.2 Crear `Dockerfile` multietapa en `Backend/` con etapas de dependencias, compilación y runner no privilegiado (`node`), verificando la compilación exitosa con `docker build -t backend-api .`.
- [x] 3.3 Configurar Prisma en `Backend/prisma/schema.prisma` conectando a PostgreSQL y crear `PrismaService` en `src/shared/infrastructure/prisma/prisma.service.ts` limitando el pool de conexiones a 5 y proveyendo el método de consulta `SELECT 1`, verificando con conexión local.

## 4. Endpoints Operativos (TDD) y Configuración de API

- [x] 4.1 **(Rojo)** Escribir la prueba e2e en `test/health.e2e-spec.ts` validando el comportamiento observable de `GET /health` (200 OK en memoria) y `GET /ready` (200 OK con base de datos disponible y 503 Service Unavailable ante fallo), verificando que la prueba falle inicialmente.
- [x] 4.2 **(Verde)** Implementar `HealthController` y `HealthModule` en `src/health/` respondiendo a `GET /health` y `GET /ready` fuera del prefijo `/v1`, integrando la verificación de Prisma, y comprobar que la prueba e2e pase en verde.
- [x] 4.3 Configurar en `src/main.ts` y `src/app.module.ts` la validación estricta de variables de entorno, Helmet, CORS, Throttler, logging estructurado Pino con inyección de cabecera `x-request-id` de correlación, y Swagger en `/docs`.
- [x] 4.4 Implementar el script `pnpm openapi:generate` para generar automáticamente el documento `openapi.json` con los metadatos de Swagger y verificar que se ejecute sin errores (RC-070).
- [x] 4.5 **(Refactor y Validación)** Ejecutar la suite completa (`pnpm lint`, `pnpm typecheck`, `pnpm test:cov`, `pnpm test:e2e`, `pnpm deps:check`), verificando que se cumplan los umbrales de cobertura y cero errores.

## 5. Pipeline de Integración Continua (GitHub Actions)

- [x] 5.1 Crear `.github/workflows/backend-ci.yml` configurando el disparador en `push` y `pull_request` sin filtro `paths`, con un job `detect-changes` que determine si hubo cambios en `Backend/`.
- [x] 5.2 Implementar los 4 jobs con nombres exactos en `.github/workflows/backend-ci.yml`:
  - `quality`: Ejecuta `pnpm lint`, `pnpm format:check`, `pnpm typecheck` y `pnpm deps:check`.
  - `test`: Ejecuta pruebas unitarias (`test:cov`) e integración (`test:e2e`) con un contenedor de servicio PostgreSQL con `healthcheck`.
  - `build`: Ejecuta `pnpm build`, `pnpm openapi:generate` (validando que no haya cambios sin confirmar en `git diff`) y `docker build`.
  - `security`: Ejecuta `pnpm audit --prod --audit-level=high` y escaneo con `gitleaks`.
  Asegurar que cada job se omita elegantemente (reportando éxito) si no hubo cambios en `Backend/` para no bloquear los checks requeridos de GitHub.

---

## Pasos manuales

1. Crear la rama `feat/project-skeleton`, subirla y abrir el Pull Request (el ruleset de `main` ya exige PR).
2. Cuando el CI haya corrido una vez, editar el ruleset "proteger-main" y agregar como checks requeridos `quality`, `test`, `build` y `security`.
3. Activar Secret scanning y Push protection (si el plan lo permite) y Dependabot alerts.
4. Crear las cuentas y servicios: Aiven (PostgreSQL gratuito en el este de EE. UU.), Render (Web Service con Root Directory Backend, Docker y variables de entorno) y el monitor externo (UptimeRobot o cron-job.org) apuntando a `/ready` cada 10 minutos.
