# Stack tecnológico, metodología y requisitos de calidad – Backend

Oct 13, 2026 · @Perez (Versión 1.1 – Auditada y alineada con OpenSpec)

Este documento fija el stack tecnológico, la arquitectura, la metodología y los requisitos de calidad del backend del Sistema de Gestión Odontológica, con la justificación de cada elección. Deriva del documento de Requerimientos del Backend; el frontend tiene su propio documento. Las decisiones son las vigentes; lo que sigue abierto está en la sección 9.

## 1. Alcance y estado

- Cubre la API, la base de datos, los archivos, la infraestructura, el CI/CD y la calidad del backend.
- El hosting corresponde a la etapa de desarrollo, con planes gratuitos y datos de prueba. Qué se mantiene en producción se decide después con los criterios de la sección 5.5.
- Los requisitos de origen se citan por su ID (RF-B y RNF-B).

## 2. Decisiones y justificación

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| TypeScript en modo estricto | Un solo lenguaje en API y pantalla, con tipos compartidos mediante OpenAPI; el compilador detecta errores antes de ejecutar | JavaScript sin tipos |
| NestJS como monolito modular | Su inyección de dependencias facilita aplicar SOLID y escribir pruebas con dobles; sus módulos encajan con una arquitectura por contextos; con 1 a 3 usuarios simultáneos, un solo despliegue es lo más barato y simple de operar | Microservicios (costo operativo sin beneficio); Django o Laravel (dos lenguajes en el proyecto) |
| Clean Architecture completa, SOLID y TDD | El sistema crecerá (la mensajería llega en la segunda fase) y no debe romperse al agregar canales; además es un objetivo de aprendizaje, y una sola forma de trabajar en todos los módulos lo facilita | Capas reducidas en los CRUD simples |
| PostgreSQL | Datos relacionales con transacciones; JSONB para el odontograma; pg\_trgm para búsqueda tolerante a errores; portable entre proveedores | MongoDB o Firestore: no encajan con reportes y relaciones |
| Prisma detrás de repositorios | Migraciones versionadas y tipos generados; al estar encapsulado puede reemplazarse | TypeORM o Drizzle, válidos pero sin ventaja decisiva |
| pg-boss | Cola sobre PostgreSQL: evita Redis, un servicio menos que pagar y vigilar; alcanza para las pocas tareas del MVP (Google Calendar con reintentos, PDF) | Redis con BullMQ; se puede migrar luego porque la cola va detrás de un puerto |
| Cloudflare R2 por API S3, con puerto `StoragePort` | Sin cobro por descarga de datos, capa gratuita y API S3 portable (RNF-B-052) | AWS S3 (queda como alternativa si el asesor jurídico exige región o certificación), Backblaze B2, Supabase Storage |
| Jest y Supertest | Son el estándar de NestJS e incluyen cobertura y dobles | Vitest |
| GitHub Actions | El código ya está en GitHub; lint, pruebas y build en cada push sin infraestructura aparte | Otros servicios de CI |
| Docker y docker compose | El mismo entorno en local, en CI y en el despliegue | Instalación manual |
| Render para la API | Despliega desde GitHub con Docker; plan gratuito en desarrollo y luego un servicio fijo en producción (Por definir aún) | Fly.io, Railway, VPS, Supabase y Firebase (sección 5.3) |
| Aiven PostgreSQL | Plan gratuito para empezar y Developer (desde unos 5 USD, no se apaga) antes de datos reales; la base queda separada del backend | Supabase (Pro, 25 USD), Fly Managed Postgres (unos 38 USD) |
| Sentry y Pino | Detectar errores antes que la doctora, con logs estructurados que no guardan datos clínicos | Registro manual |

## 3. Arquitectura

### 3.1 Monolito modular

El backend es un único despliegue con módulos que se comunican por interfaces o eventos internos. Cada módulo aplica Clean Architecture con cuatro capas completas. Todas las tablas llevan un identificador de consultorio (`clinicId`) desde el inicio (RNF-B-032), aunque hoy exista un solo consultorio.

```
Backend/src/
  modules/
    identity/      consultorio (Clinic), usuarios, roles, sesiones, configuración base
    patients/      pacientes, consentimiento Ley 1581, búsqueda pg_trgm
    catalogs/      catálogo de procedimientos, precios por paciente, materiales propios y stock
    clinical/      historia clínica, antecedentes, atención, odontograma, materiales usados, PDF clínico
    scheduling/    citas, disponibilidad, bloqueos, Google Calendar
    billing/       cotizaciones, PDF de cotización, cobros
    files/         fotos, radiografías, miniaturas, plantillas y firmas de consentimientos
    reporting/     reportes financieros y operativos (solo lectura)
    audit/         registro inmutable de auditoría
    messaging/     WhatsApp y asistente (segunda fase)
  health/          endpoints /health y /ready
  shared/          kernel compartido: errores de dominio, reloj, identificadores, UnitOfWork, logger, filtros
```

**Reglas de fronteras entre módulos (resolución de auditoría):**
- **`identity` aloja la entidad `Clinic`:** Dado que todas las tablas requieren `clinicId` desde el inicio (RNF-B-032) y se debe configurar el perfil del consultorio (RF-B-141), la entidad `Clinic` y su administración viven dentro de `identity` y se exponen vía su `index.ts` público.
- **`catalogs` es un módulo independiente:** Para respetar el Principio de Responsabilidad Única (SRP) y el límite de ~400 líneas por PR (RC-014), los catálogos de procedimientos, precios y materiales propios (con su control de stock, RF-B-050 a RF-B-053) se separan de `patients` y `clinical` en su propio módulo `modules/catalogs/`, exponiendo sus consultas y comandos de descuento de stock a través de su `index.ts` público.
- **`files` aloja los consentimientos informados:** Tanto los archivos clínicos (fotos, radiografías) como las plantillas y PDFs firmados de consentimientos informados (RF-B-090 a RF-B-102) residen en `modules/files/` porque comparten el puerto `StoragePort` (Cloudflare R2) y la generación documental.
- Cada módulo se crea en sus propios *changes* atómicos de OpenSpec, con sus pruebas. El esqueleto inicial solo incluye `shared/` y `health/`; no se crean carpetas de módulos vacías.

### 3.2 Clean Architecture: capas y reglas

Las dependencias apuntan solo hacia adentro: presentation e infrastructure dependen de application, y application depende de domain; domain no depende de nada.

| Capa | Contiene | Puede depender de | No puede depender de |
| --- | --- | --- | --- |
| domain | Entidades, agregados, objetos de valor, eventos de dominio, errores de dominio y los puertos (interfaces) | Solo de `shared/domain` | Nest, Prisma, HTTP o cualquier librería de infraestructura |
| application | Casos de uso, comandos y consultas, y puertos de aplicación (reloj, generador de identificadores, unidad de trabajo) | domain y `shared/application` | infrastructure, presentation y el framework, salvo los decoradores `@Injectable` e `@Inject` de Nest |
| infrastructure | Repositorios Prisma, adaptadores (R2, Google Calendar, pdfmake, sharp, correo) y mapeadores | application, domain y `shared` | presentation |
| presentation | Controladores, DTO de entrada y salida con validación, guards y filtros de errores | application y `shared` | infrastructure |

**Contenido obligatorio de `shared/` (Kernel Compartido):**
Antes de construir el primer módulo de negocio (`identity`), el change `add-shared-kernel-and-observability` debe establecer en `Backend/src/shared/`:
1. `shared/domain`: Clase base abstracta `DomainError` (con código tipado y metadatos seguros), clase base `AggregateRoot` y definición de `DomainEvent`.
2. `shared/application/ports`: Puertos transversales `ClockPort` (provee fecha/hora actual en UTC y utilidades de zona horaria `America/Bogota`), `IdGeneratorPort` (generación de UUID v4/v7), `UnitOfWorkPort` (ejecución transaccional atómica) y `EventBusPort`.
3. `shared/infrastructure`: Adaptadores `SystemClock`, `UuidGenerator`, `PrismaUnitOfWork`, `NestEventBus` (sobre `@nestjs/event-emitter`), configuración de `PinoLogger` con `correlationId` y redacción automática de campos sensibles/clínicos, e integración con `Sentry`.
4. `shared/presentation`: `DomainExceptionFilter` global que traduce subclases de `DomainError` a códigos HTTP estándar (`400`, `401`, `403`, `404`, `409`, `422`), decoradores `@CurrentUser()` y `@CurrentClinic()`.

Reglas obligatorias:

1. **Regla de dependencia:** los imports solo apuntan hacia adentro; el CI la verifica con `dependency-cruiser`.
2. **Puertos y adaptadores:** los puertos se declaran en domain o application y los adaptadores viven en infrastructure.
3. **Un solo punto de ensamblaje:** el archivo `*.module.ts` de cada módulo enlaza puertos con adaptadores mediante tokens de inyección.
4. **Tres modelos distintos:** entidad de dominio, modelo de Prisma y DTO de HTTP son tipos diferentes, convertidos con mapeadores en los bordes.
5. **Controladores delgados:** validan la entrada, llaman a un caso de uso y devuelven la respuesta, sin reglas de negocio.
6. **Transacciones en la capa de aplicación,** mediante el puerto `UnitOfWorkPort`, que Prisma implementa.
7. **Errores tipados:** el dominio lanza errores que heredan de `DomainError` y el filtro global en presentation los traduce a respuestas HTTP uniformes.
8. **Entre módulos:** un módulo solo importa de otro su `index.ts` público (casos de uso, puertos y eventos), nunca sus capas internas; la reacción a hechos de otro módulo se hace con eventos de dominio.
9. **Propiedad de los datos:** cada módulo es dueño de sus tablas. `reporting` es la excepción: lee de todas con consultas de solo lectura y nunca escribe.
10. **Idioma del código:** inglés para clases, métodos, variables y rutas; los términos clínicos se registran con su traducción en `Backend/docs/glosario.md`.
11. **Sin módulos reducidos:** todos los módulos, incluidos catálogos y configuración, usan las cuatro capas, para trabajar de una sola forma y aprender sin atajos.
12. **Plantillas de generación:** Plop crea la estructura de un módulo o caso de uso con sus archivos y su prueba. El módulo `patients` se documenta como referencia.
13. **Revisión:** al cierre del MVP se evalúa en un ADR el costo de la estructura completa en los módulos de solo lectura.

Patrones en uso: repositorio, caso de uso, agregado (la atención con sus procedimientos y materiales; la cotización con sus ítems), objetos de valor (dinero, pieza dental, rango horario, color de material), eventos de dominio (`AttentionClosed`, `AppointmentCreated`), unidad de trabajo, adaptador y mapeador.

Anti-patrones prohibidos: lógica de negocio en controladores, Prisma dentro de casos de uso, servicios gigantes, importar capas internas de otro módulo y compartir tablas de escritura entre módulos.

### 3.3 Principios SOLID aplicados

| Principio | Cómo se aplica | Cómo se verifica |
| --- | --- | --- |
| S, responsabilidad única | Un caso de uso por clase con un solo método público, `execute`; un controlador por recurso sin lógica de negocio; un repositorio por agregado. `CloseAttentionUseCase` no genera PDF ni envía mensajes: eso lo hacen manejadores del evento `AttentionClosed`. | Revisión del PR, RC-013 y RC-015 |
| O, abierto y cerrado | Se extiende con nuevas implementaciones. Los tipos de hallazgo del odontograma salen de un catálogo; cada canal de mensajería es un adaptador de `MessagingPort`; cada reporte implementa `ReportQuery`. Agregar el correo en la segunda fase no modifica ningún caso de uso. | Las pruebas existentes no cambian al agregar un adaptador |
| L, sustitución de Liskov | Todo adaptador cumple el contrato completo de su puerto, incluidos errores y casos límite. Una suite de contrato corre contra la implementación en memoria y contra la real (Prisma, MinIO). | Suite de contrato, RC-018 |
| I, segregación de interfaces | Puertos pequeños: `AttentionRepository` (escritura) separado de `AttentionQueries` (lecturas para listados y reportes); `StoragePort` con `upload`, `signRead` y `delete`; `MessagingPort` con `send`. Como guía, un puerto no pasa de 5 métodos. | Revisión del PR |
| D, inversión de dependencias | Domain y application dependen de puertos; infrastructure los implementa; el módulo de Nest los ensambla. Nada de `new` de servicios en domain o application; el reloj y el generador de identificadores se inyectan (`ClockPort`, `IdGeneratorPort`), lo que hace deterministas las pruebas. | dependency-cruiser, RC-012 y RC-016 |

### 3.4 Ejemplo de módulo y de flujo

```
modules/clinical/
  domain/
    attention.entity.ts           agregado raíz
    odontogram.entity.ts
    tooth-finding.vo.ts           objeto de valor
    attention-closed.event.ts
    attention.repository.ts       puerto
    clinical.errors.ts
  application/
    close-attention.use-case.ts
    record-material-used.use-case.ts
    get-tooth-history.query.ts
  infrastructure/
    prisma-attention.repository.ts
    attention.mapper.ts
  presentation/
    attention.controller.ts
    dto/close-attention.dto.ts
  clinical.module.ts              ensamblaje
  index.ts                        API pública del módulo
```

Flujo “cerrar una atención”:

1. `AttentionController` recibe `POST /v1/attentions/:id/close`, valida el DTO y un guard comprueba el rol.
2. Llama a `CloseAttentionUseCase.execute`.
3. El caso de uso carga la `Attention` por `AttentionRepository` y llama a `attention.close(now)`. La regla de dominio exige al menos un procedimiento y que no esté ya cerrada; las ediciones posteriores quedan versionadas (RF-B-028, RF-B-029).
4. Guarda dentro de `UnitOfWorkPort` y publica `AttentionClosed`.
5. Otros módulos reaccionan por eventos: `catalogs` descuenta el stock de materiales propios, `billing` propone el cobro, `audit` registra el cambio y, en la segunda fase, `messaging` programa el seguimiento.
6. El controlador devuelve el DTO de respuesta; `DomainExceptionFilter` traduce los errores de dominio a HTTP.

Pruebas: `Attention.close` como prueba unitaria sin Nest ni base de datos; el caso de uso con repositorio en memoria y reloj fijo; `PrismaAttentionRepository` contra PostgreSQL real; y el endpoint con Supertest, incluidos los permisos por rol.

### 3.5 Tecnologías de apoyo

| Necesidad | Tecnología | Por qué | Requisito |
| --- | --- | --- | --- |
| Validación de entrada | class-validator con ValidationPipe | Integrado en NestJS y declarativo en los DTO | RNF-B-005 |
| Autenticación | Passport JWT, renovación en cookie httpOnly, Argon2 | Cookie httpOnly protege el token de scripts; Argon2 es un hash robusto para contraseñas | RF-B-001, RNF-B-003 |
| Autorización | Guards por rol, evaluados en el servidor | La decisión nunca depende del cliente | RF-B-002, RNF-B-004 |
| Eventos internos | @nestjs/event-emitter | Desacopla módulos sin infraestructura adicional | — |
| Tareas con reintentos | pg-boss | Reintentos y persistencia usando la base existente | RNF-B-023 |
| Búsqueda de pacientes | pg\_trgm | Tolera errores tipográficos sin un motor de búsqueda aparte | RF-B-012 |
| PDF | pdfmake | Ligero (cabe en 512 MB) y admite SVG para el odontograma y trazos de firma para consentimientos | RF-B-030, RF-B-101, RF-B-111 |
| Miniaturas | sharp, una imagen a la vez | Rápido; se limita la concurrencia por el límite de memoria | RF-B-092 |
| Google Calendar | googleapis con OAuth | Cliente oficial | RF-B-062 |
| Documentación de la API | @nestjs/swagger, API versionada en `/v1` | Genera el contrato OpenAPI que consume el frontend | RNF-B-040 |
| Seguridad HTTP | Helmet, @nestjs/throttler, CORS restringido | Cabeceras seguras y límite de intentos | RNF-B-006 |
| Logs y errores | Pino y Sentry | Logs estructurados baratos y alertas de errores | RNF-B-009, RNF-B-044 |

La segunda fase (WhatsApp Cloud API, correo transaccional y proveedor de IA tras un puerto) se decide al iniciarla.

### 3.6 Datos

- Prisma gestiona esquema y migraciones versionadas; sus tipos no salen de infrastructure.
- El odontograma se guarda como JSONB estructurado (RF-B-044). Las fechas se almacenan en UTC y se muestran en America/Bogota (RNF-B-045).
- El plan gratuito de Aiven admite 20 conexiones: el pool de Prisma se limita a 5 y el de pg-boss a 3, dejando margen para migraciones.
- Los pacientes y las historias clínicas no se eliminan físicamente (RF-B-010, RNF-B-012).

## 4. Archivos clínicos y consentimientos: Cloudflare R2

Se elige R2 porque no cobra la descarga de datos (clave en galerías de imágenes y PDFs de consentimientos), tiene capa gratuita y habla la API S3, lo que permite cambiar de proveedor reemplazando un adaptador. Los precios y límites cambian: confirmar la tarifa vigente.

- Acceso siempre por la API S3 y a través del puerto `StoragePort` (RNF-B-052).
- Bucket privado; entrega solo con URLs firmadas de corta duración (RF-B-094). La subida se hace directo desde el iPad con URL firmada, sin pasar por la API.
- Llaves con identificadores (`consultorio/paciente/tipo/uuid`), nunca con el nombre del paciente.
- Validación de tipo y tamaño (hasta 25 MB) en el servidor; un bucket por entorno.
- Los consentimientos informados firmados en pantalla (RF-B-101) o escaneados en físico (RF-B-102) se almacenan en R2 bajo el tipo `consent`.
- Antes de producción se define la copia de seguridad de las radiografías y se verifica si el proveedor ofrece versionado. Si el asesor jurídico exige región o certificación, la alternativa es AWS S3.

## 5. Infraestructura y entornos

### 5.1 Entornos

| Entorno | API | Base de datos | Archivos | Datos |
| --- | --- | --- | --- | --- |
| Local | Docker compose | PostgreSQL en contenedor | MinIO (emula S3) | Ficticios |
| Desarrollo (nube) | Render, plan gratuito | Aiven, plan gratuito | R2, bucket de desarrollo | Solo de prueba |
| Producción | Por definir | Aiven Developer | R2, bucket propio | Reales |

### 5.2 Contenedores y configuración

- Imagen Docker multietapa para la API, con usuario sin privilegios y sin dependencias de desarrollo.
- Secretos en variables protegidas de cada proveedor y en GitHub Secrets; nunca en el repositorio.
- Conexión a la base con TLS obligatorio y un usuario exclusivo de la aplicación con permisos mínimos. Los planes de Aiven no ofrecen red privada ni IP estática, así que esa conexión queda expuesta a internet y se protege con esas medidas.
- Render usa `/health` como verificación de salud (`healthCheckPath`). Nunca `/ready`: una caída momentánea de la base no debe provocar el reinicio de la API.

### 5.3 Por qué este hosting

- **Región:** el plan gratuito de Aiven está solo en regiones de EE. UU., Canadá y Europa, no en Sudamérica. Por eso la API va en el este de EE. UU., junto a la base, para minimizar la latencia entre ambas.
- **Render:** despliegue desde GitHub con Docker, sin costo en desarrollo y precio fijo en producción. Su límite es el salto de Starter a Standard (25 USD) sin escalón intermedio.
- **Fly.io:** permite ajustar la RAM de a poco (unos 4 a 8 USD) pero no tiene plan gratuito; se evalúa si 512 MB no alcanzan para las imágenes. Su Postgres administrado (unos 38 USD) lo hizo inviable como base.
- **Railway:** el precio base es un mínimo y el costo final depende del uso, lo que dificulta prever el gasto.
- **VPS:** el más barato por recurso, pero exige operar sistema, certificados, copias y parches con datos de salud.
- **Supabase o Firebase como backend:** descartados. Supabase movería las reglas de negocio a SQL y funciones difíciles de probar con TDD y de ordenar con Clean Architecture; Firebase usa una base de documentos que no encaja con reportes relacionales, requiere plan de pago para sus funciones y ata a Google.

### 5.4 Keep-alive en desarrollo

Los planes gratuitos se apagan por inactividad: Render se duerme tras 15 minutos sin tráfico y Aiven puede apagar la base.

1. Un monitor externo (UptimeRobot o cron-job.org) llama cada 10 minutos a `/ready`, endpoint público que ejecuta `SELECT 1` en la base y no devuelve datos. Una sola llamada mantiene despiertos a Render y a Aiven. `/health` es un ping ligero que no consulta la base; ambos endpoints van fuera del prefijo `/v1`.
2. Como respaldo, un workflow de GitHub Actions (`.github/workflows/db-keepalive.yml`) cada 3 días ejecuta `SELECT 1` con un usuario de solo lectura, con `workflow_dispatch` y alerta si falla. Los cron de GitHub pueden retrasarse, por eso no sustituyen al monitor externo.
3. Ambos mecanismos se retiran al pasar a planes de pago.

Mientras se usen planes gratuitos no se cargan historias clínicas reales: no tienen SLA, pueden apagarse y no ofrecen red privada.

### 5.5 Criterios para pasar a producción con datos reales

1. Base en plan de pago (Aiven Developer) con copias diarias y una restauración probada y documentada.
2. API en un plan sin suspensión (ruta prevista: Render Starter; Fly.io si 512 MB no alcanzan).
3. Keep-alive retirado y monitoreo de disponibilidad activo.
4. Revisión jurídica de la Ley 1581 de 2012, la autorización de tratamiento de datos y la transferencia internacional, con servidores en EE. UU.
5. Auditoría, roles y permisos probados, y pruebas de seguridad de la sección 8.3 completadas.
6. Prueba de subida de una radiografía de 25 MB dentro de la memoria del plan elegido.

Costo estimado: 0 USD en desarrollo (confirmar límites de R2). En producción, con esta ruta, unos 12 USD al mes más R2. Confirmar precios vigentes antes de fijar presupuesto (RNF-B-050).

## 6. Control de versiones y metodología

### 6.1 Repositorio

El proyecto vive en un monorepo: un solo repositorio de Git con el backend y el frontend en carpetas separadas, y despliegues independientes. Se elige porque un cambio que toca la base de datos, la API y la pantalla (por ejemplo, agregar el color de resina) es un solo pull request; el contrato OpenAPI y el cliente del frontend se regeneran en el mismo cambio, y el CI falla si algo se rompe; y la configuración de lint, TypeScript, Husky, Dependabot y el tablero es única, lo que reduce la carga de una sola persona.

```
Sistema Odontologico/
  Backend/         NestJS (con su docs/ y su openspec/)
  Frontend/        React + Vite (con su docs/ y su openspec/)
  .github/workflows/
  pnpm-workspace.yaml
```

- Render despliega la API desde `Backend` (Root Directory) con su `Dockerfile`.
- Los workflows viven en `.github/workflows/` en la raíz, porque GitHub solo los reconoce ahí. Respeta las mayúsculas exactas de las rutas, ya que los runners son Linux.
- `main` protegida: sin push directo y fusión solo con el CI en verde.
- Ramas cortas (uno o dos días de vida) y commits con Conventional Commits, verificados con commitlint.
- Husky con lint-staged corre lint y formato antes de cada commit.
- Cada pull request enlaza al requisito que implementa mediante una plantilla de PR.
- Dependabot activo para dependencias y alertas de seguridad.
- Turborepo no se usa al inicio; el CI aplica filtros de rutas (`Backend/**`, `Frontend/**`).
- `pnpm-workspace.yaml` está en la raíz e incluye `Backend` y `Frontend`.

### 6.2 Proceso y Flujo Spec-Driven con OpenSpec

1. **Desarrollo guiado por especificaciones (OpenSpec):** Todo cambio se planifica y ejecuta mediante *changes* atómicos en `Backend/openspec/changes/<change-id>/` y `Frontend/openspec/changes/<change-id>/` siguiendo el ciclo `opsx-propose` -> `opsx-apply` -> `opsx-sync` -> `opsx-archive`. Ningún *change* debe superar las ~400 líneas de código productivo (RC-014), por lo que cada módulo se divide en *changes* granulares.
2. **Esqueleto y Kernel Compartido primero:** El repositorio, Docker, CI, despliegue a Render y los endpoints `/health` y `/ready` (`B-01`), seguidos del Kernel Compartido (`shared/`) y observabilidad (`B-02`), deben estar archivados antes de construir funciones de negocio.
3. **Backend completo primero, módulo por módulo:** Cada módulo se construye de punta a punta en la API mediante sus *changes* en OpenSpec y se cierra con su documento OpenAPI en `main` y sus pruebas e2e en verde, antes de empezar el siguiente módulo que dependa de él. El frontend se construye después, en el mismo orden de módulos.
4. **Iteraciones de dos semanas:** Cada una cierra uno o más módulos. Antes de cerrar un módulo del backend se repasa su flujo con la doctora en un boceto o en papel, para que el contrato no cambie después. Las demostraciones con la aplicación en el iPad empiezan con el frontend.
5. **Backlog en GitHub Projects,** con una incidencia por requisito enlazada a su ID (RF-B-025), para mantener la trazabilidad.
6. **Decisiones documentadas** en ADR dentro de `Backend/docs/adr/`.
7. **Banderas de función** por variable de entorno para mantener la mensajería desactivada en el MVP.

### 6.3 TDD y niveles de prueba

Ciclo: prueba que falla, código mínimo que la pasa, refactor. Clean Architecture permite probar las reglas sin levantar Nest ni la base de datos.

| Nivel | Qué se prueba | Cómo |
| --- | --- | --- |
| Dominio | Reglas puras: solapamiento de citas, saldos, versionado de atenciones | Pruebas unitarias sin Nest ni base de datos |
| Casos de uso | Flujos como cerrar una atención o crear una cotización | Repositorios en memoria como dobles y reloj fijo (`ClockPort`) |
| Infraestructura | Repositorios y adaptadores | PostgreSQL real en contenedor; suite de contrato |
| API | Contratos y permisos por rol | Supertest; caminos felices y errores clave |

### 6.4 Definición de terminado (por cada Change de OpenSpec)

- Los artefactos de OpenSpec (`proposal.md`, `design.md`, `specs/`, `tasks.md`) están completos y validados.
- La prueba se escribió antes o junto con el código (TDD).
- El CI está en verde y la cobertura no baja de los umbrales (90 % en dominio/aplicación, 80 % global).
- El documento `openapi.json` está actualizado y confirmado.
- El PR enlaza al requisito, fue revisado con la lista de verificación y el *change* fue sincronizado (`opsx-sync`) y archivado (`opsx-archive`).

### 6.5 Ruta de construcción del MVP (Alineada con el Plan Maestro de OpenSpec)

Es común al backend y al frontend. Primero se construye todo el backend (21 *changes*), módulo por módulo; después el frontend (14 *changes*), en el mismo orden, probando cada módulo contra la API real. El detalle de cada *change* vive en `PLAN-MAESTRO-OPENSPEC.md`.

**Etapa 1: Backend (Changes B-01 a B-21)**

1. **Esqueleto y Kernel Compartido (`B-01`, `B-02`):** Repositorio, Docker, CI, despliegues, `/health`, `/ready`, keep-alive, `shared/` (`ClockPort`, `IdGeneratorPort`, `UnitOfWorkPort`, `DomainError`), Pino, Sentry, Helmet, Throttler, glosario y Plop.
2. **Identidad, Consultorio y Roles (`B-03`, `B-04`):** Módulo `identity` con entidad `Clinic`, usuarios, roles (`ADMIN`, `AUXILIARY`), autenticación JWT + cookie httpOnly, Argon2 y configuración del consultorio.
3. **Pacientes y Catálogos (`B-05`, `B-06`, `B-07`):** Módulo `patients` de referencia (CRUD lógico, duplicados, consentimiento Ley 1581 y búsqueda `pg_trgm`) y módulo `catalogs` (procedimientos, precios por paciente, materiales propios y stock).
4. **Historia clínica, Odontograma y Atención (`B-08` a `B-12`):** Módulo `clinical` con historia clínica, antecedentes, odontograma JSONB + instantáneas, atención con materiales por diente (descontando stock), notas privadas, cierre con versionado inmutable y exportación a PDF con `pdfmake`.
5. **Agenda y Google Calendar (`B-13`, `B-14`):** Módulo `scheduling` con disponibilidad semanal, bloqueos, validación de solapamientos y límite diario, y sincronización bidireccional asíncrona con Google Calendar mediante `pg-boss`.
6. **Archivos clínicos y Consentimientos informados (`B-15`, `B-16`):** Módulo `files` con fotos y radiografías en R2 (`StoragePort`), miniaturas con `sharp`, plantillas de consentimiento informado y captura de firma digital generando PDF firmado inalterable (además de adjunto físico).
7. **Cotizaciones y Cobros (`B-17`, `B-18`):** Módulo `billing` con cotizaciones, exportación a PDF y registro de cobros vinculados a la atención.
8. **Reportes, Auditoría y Endurecimiento (`B-19`, `B-20`, `B-21`):** Módulo `reporting` (ingresos, captación, procedimientos), módulo `audit` (log inmutable de accesos/cambios), pruebas de carga con `k6`, scripts de copias de seguridad y verificación OWASP ZAP.

**Etapa 2: Frontend, en el mismo orden de módulos (Changes F-01 a F-14)**

9. **Esqueleto PWA y Núcleo Offline (`F-01`, `F-02`):** Vite, React, PWA, CI, cliente OpenAPI, Dexie (IndexedDB), sincronización offline y App Shell iPad-first.
10. **Inicio de sesión, roles y usuarios (`F-03`).**
11. **Pacientes, catálogos y configuración del consultorio (`F-04`).**
12. **Historia clínica guiada, odontograma interactivo SVG y atención rápida (`F-05`, `F-06`, `F-07`); primera demostración en el iPad.**
13. **Tablero Hoy y Agenda con FullCalendar (`F-08`).**
14. **Archivos clínicos, visor de radiografías y firma de consentimientos en pantalla (`F-09`, `F-10`).**
15. **Constructor de cotizaciones y registro de cobros (`F-11`, `F-12`).**
16. **Tablero de reportes (`F-13`) y suite E2E Playwright + auditoría PWA (`F-14`).**

Cada módulo del frontend se cierra con una demostración a la doctora. Al final, revisión jurídica, pruebas con datos ficticios y criterios de la sección 5.5.

La segunda fase (WhatsApp, asistente de IA, recordatorios, agendamiento público, comparación antes/después y seguimiento) se construye sobre el módulo `messaging` ya reservado.

## 7. Pipeline de CI/CD

Se ejecuta en cada push y en cada pull request, en GitHub Actions.

| Paso | Herramienta | Criterio de fallo |
| --- | --- | --- |
| Instalación | pnpm con archivo de bloqueo congelado y caché | Archivo de bloqueo desactualizado |
| Lint y formato | ESLint y Prettier | Cualquier error o advertencia |
| Tipos | `tsc --noEmit` en modo estricto | Cualquier error |
| Arquitectura | dependency-cruiser | Violación de la regla de dependencia |
| Pruebas unitarias | Jest, con cobertura | Prueba fallida o cobertura bajo el umbral |
| Integración y API | Jest y Supertest contra PostgreSQL como contenedor de servicio | Prueba fallida o migración que no aplica sobre una base vacía |
| Contrato | Generación del documento OpenAPI | Cambios sin confirmar en el contrato |
| Build | Compilación de la API | Cualquier error |
| Imagen Docker | `docker build`, sin publicarla en los PR | Falla de construcción |
| Seguridad | `pnpm audit --prod` y escaneo de secretos de GitHub | Vulnerabilidad alta o crítica, o secreto detectado |
| Despliegue | Render, al fusionar en `main` y solo tras pasar los checks | Cualquier paso anterior en rojo |

## 8. Requisitos de calidad

La columna Bloquea indica si el incumplimiento impide fusionar el cambio.

### 8.1 Pruebas y cobertura

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-001 | Cobertura mínima del 80 % en líneas, ramas, funciones y sentencias en la API. | Umbral en Jest | Sí |
| RC-002 | Cobertura mínima del 90 % en dominio y casos de uso. | Umbral por carpeta | Sí |
| RC-003 | Toda regla de negocio nueva se escribe con TDD. | Lista de verificación del PR | Sí |
| RC-004 | Las pruebas son deterministas: sin dependencia de la hora real, del orden ni de la red; las integraciones externas se simulan. | Ejecución repetida en CI | Sí |
| RC-005 | Cada endpoint tiene pruebas de permisos por rol (RNF-B-004). | Pruebas de API | Sí |
| RC-007 | El pipeline completo tarda menos de 10 minutos. | Tiempo del workflow | No |

### 8.2 Código y arquitectura

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-010 | Cero errores y cero advertencias de ESLint; formato con Prettier. | CI | Sí |
| RC-011 | TypeScript estricto y sin `any` explícito, salvo excepción comentada. | `tsc` y regla `no-explicit-any` | Sí |
| RC-012 | El dominio no depende de infraestructura ni de Nest, y los tipos de Prisma no salen de infraestructura. | dependency-cruiser | Sí |
| RC-013 | Complejidad ciclomática máxima de 10 por función. | Regla `complexity` de ESLint | Sí |
| RC-014 | Los pull requests modifican alrededor de 400 líneas como máximo, sin contar código generado. | Revisión | No |
| RC-015 | Cada caso de uso es una clase con un único método público, `execute`, y los controladores no contienen lógica de negocio. | Revisión del PR y regla de lint personalizada | Sí |
| RC-016 | Domain y application no instancian servicios con `new`: dependen de puertos inyectados por constructor, incluidos `ClockPort` e `IdGeneratorPort`. | dependency-cruiser y revisión | Sí |
| RC-017 | Un módulo solo importa de otro su `index.ts` público. | dependency-cruiser | Sí |
| RC-018 | Cada puerto con más de una implementación tiene una suite de pruebas de contrato que corre contra todas ellas. | Pruebas de contrato en CI | Sí |

### 8.3 Seguridad

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-020 | Sin vulnerabilidades altas ni críticas en dependencias de producción. | `pnpm audit --prod` | Sí |
| RC-021 | Escaneo de secretos con protección de push activos; ningún secreto en el repositorio. | GitHub | Sí |
| RC-022 | Alertas de Dependabot de seguridad atendidas en menos de 7 días. | Revisión semanal | No |
| RC-023 | Datos clínicos nunca en logs, en Sentry ni en URLs (RNF-B-009). | Pruebas del logger y revisión | Sí |
| RC-024 | Los archivos solo se entregan con URL firmada; el acceso sin firma falla (RF-B-094). | Prueba de integración | Sí |
| RC-025 | Antes de producción: revisión del OWASP Top 10, escaneo con OWASP ZAP en modo base y verificación de cabeceras de seguridad. | Informe documentado | Criterio de producción |

### 8.4 Rendimiento

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-030 | Percentil 95 menor de 500 ms en lecturas y de 1 s en escrituras (RNF-B-030), con la instancia despierta. | Pruebas de carga ligeras con k6 | Criterio de producción |
| RC-031 | Búsqueda de pacientes en menos de 300 ms con 10.000 registros (RNF-B-031). | Datos sintéticos | Criterio de producción |

### 8.5 Confiabilidad y datos

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-050 | Migraciones versionadas, aplicadas sobre una base vacía en CI y con reversión documentada (RNF-B-043). | CI | Sí |
| RC-051 | Copias diarias y una restauración probada antes de producción (RNF-B-021, RNF-B-022). | Informe de prueba | Criterio de producción |
| RC-052 | `/health` (proceso activo, sin consultar la base) y `/ready` (con `SELECT 1` a la base) disponibles, ambos fuera de `/v1`. | Pruebas de API | Sí |
| RC-053 | Las integraciones externas usan reintentos y no bloquean la operación (RNF-B-023). | Pruebas con fallos simulados | Sí |
| RC-054 | Fechas en UTC y presentadas en America/Bogota, con pruebas en cambios de día (RNF-B-045). | Pruebas unitarias | Sí |
| RC-055 | La historia clínica no se elimina físicamente y conserva versiones (RF-B-028, RNF-B-012). | Pruebas de dominio e integración | Sí |

### 8.6 Observabilidad

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-060 | Sentry activo en la API, con alertas al desarrollador y sin datos clínicos. | Evento de prueba | No |
| RC-061 | Logs estructurados en JSON con identificador de correlación por petición. | Prueba de middleware | Sí |
| RC-062 | Registro de auditoría de accesos y cambios sobre datos de pacientes (RF-B-140). | Pruebas de integración | Sí |

### 8.7 Documentación y proceso

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-070 | OpenAPI generado automáticamente y sin cambios sin confirmar. | Paso de contrato del CI | Sí |
| RC-071 | El README permite arrancar el proyecto local en menos de 15 minutos. | Revisión en cada iteración | No |
| RC-072 | Cada decisión de arquitectura queda en un ADR. | Revisión del PR | No |
| RC-073 | Cada PR enlaza al requisito que implementa. | Plantilla de PR | Sí |
| RC-074 | Commits con Conventional Commits. | commitlint | Sí |
| RC-075 | `main` protegida y fusión solo con el CI en verde. | Protección de rama | Sí |
| RC-076 | Demostración a la doctora al cierre de cada iteración, con su retroalimentación registrada. | Acta de la reunión | No |

## 9. Riesgos y pendientes

### Riesgos

- **Planes gratuitos:** Render se duerme y tiene 512 MB de RAM, y Aiven puede apagar o reubicar la base. Mitigación: keep-alive, solo datos de prueba y los criterios de la sección 5.5.
- **Memoria al procesar radiografías de 25 MB:** puede superar los 512 MB. Mitigación: compresión previa en el cliente, procesamiento de una imagen a la vez y Fly.io como alternativa.
- **Costo de la estructura completa de Clean Architecture:** más código por funcionalidad. Mitigación: generador de plantillas (Plop), módulo de referencia (`patients`) y revisión al cierre del MVP.

### Pendientes

- Confirmar que Render ofrece región en el este de EE. UU. y que Aiven gratuito tiene una región cercana (en listados recientes figuran Nueva York, Toronto y San Francisco), y el precio vigente del plan Developer.
- Fijar cuándo se pasa a planes de pago, antes de cargar datos reales.
- Validación jurídica de la transferencia internacional de datos de salud y del lugar de almacenamiento de archivos.
- Proveedores de la segunda fase: correo transaccional e inteligencia artificial.