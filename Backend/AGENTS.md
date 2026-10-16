# AGENTS.md – Backend

Instrucciones para asistentes de IA que trabajan en este directorio (`Backend/`). Léelas completas al iniciar cada sesión. Responde y redacta en español; el código (clases, métodos, variables, rutas) va en inglés.

## 1. Proyecto

Sistema de gestión para el consultorio de una odontóloga independiente (1 a 3 usuarios). Este directorio es la API: TypeScript estricto, NestJS como monolito modular, PostgreSQL con Prisma, pg-boss para tareas en segundo plano, Cloudflare R2 por API S3, Jest y Supertest.

El frontend está en `../Frontend` con su propio OpenSpec. Este backend es dueño de las reglas de negocio y del contrato OpenAPI.

## 2. Documentos de referencia (`docs/`)

- `docs/requerimientos_backend_sistema_de_gestión_odontológica_V1.1.md`: qué construir (RF-B y RNF-B). La columna MVP manda.
- `docs/backend_stack_tecnologico_metodologia_y_calidad_V1.1.md`: cómo construirlo (arquitectura, tecnologías, metodología y requisitos de calidad RC).

No cargues los documentos completos. Lee solo las secciones que necesita el change:

| Necesitas | Dónde |
|---|---|
| Requisitos de autenticación, pacientes, historia clínica, odontograma | Requerimientos, secciones 3.1 a 3.4 |
| Catálogos, agenda, archivos, consentimientos | Requerimientos, secciones 3.5, 3.6, 3.8 y 3.9 |
| Cotizaciones, cobros, reportes, auditoría | Requerimientos, secciones 3.10 a 3.13 |
| Seguridad, normativa, rendimiento, mantenibilidad | Requerimientos, sección 4 |
| Capas y reglas de Clean Architecture | Stack, secciones 3.2 y 3.4 |
| Principios SOLID aplicados | Stack, sección 3.3 |
| Tecnologías de apoyo y datos | Stack, secciones 3.5 y 3.6 |
| Archivos en R2 | Stack, sección 4 |
| TDD, definición de terminado, pipeline | Stack, secciones 6.3, 6.4 y 7 |
| Requisitos de calidad (RC) | Stack, sección 8 |

Si un requisito contradice a los documentos, falta información o es ambiguo, pregunta antes de continuar. No inventes requisitos.

## 3. Flujo de trabajo con OpenSpec

1. Un change por módulo, con nombre en kebab-case (por ejemplo `add-patients`). Su pareja en el otro lado lleva el mismo nombre y se construye después: el change del backend se cierra antes de empezar el del frontend.
2. Orden: explore, propose, revisión humana, apply, archive. Las reglas de cada artefacto están en `openspec/config.yaml`; síguelas.
3. No implementes nada hasta que el desarrollador apruebe el proposal, las specs y el design.
4. Cita siempre los IDs de requisito (RF-B, RNF-B y RC) en el proposal, las specs y las tareas.
5. Trabaja un solo change a la vez y no toques código fuera de su alcance.
6. No modifiques `docs/` ni `openspec/config.yaml` salvo petición expresa.
7. Este backend se archiva primero; el change del frontend cita el de aquí como fuente de las reglas.

## 4. Arquitectura (no negociable)

Clean Architecture completa en TODOS los módulos, incluidos catálogos y configuración, con cuatro capas:

- `domain`: entidades, agregados, objetos de valor, eventos de dominio, errores de dominio y puertos (interfaces). No importa Nest, Prisma ni nada externo.
- `application`: casos de uso, comandos, consultas y puertos de aplicación (`Clock`, `IdGenerator`, `UnitOfWork`). Solo depende de `domain`. La única excepción permitida de Nest son los decoradores `@Injectable` e `@Inject`.
- `infrastructure`: repositorios Prisma, adaptadores (R2, Google Calendar, pdfmake, sharp) y mapeadores.
- `presentation`: controladores, DTO con validación, guards y filtros de errores.

Reglas:

1. Las dependencias solo apuntan hacia adentro.
2. Los puertos se declaran en `domain` o `application`; los adaptadores viven en `infrastructure`.
3. El archivo `*.module.ts` de cada módulo es el único lugar donde se ensamblan puertos y adaptadores, con tokens de inyección.
4. Entidad de dominio, modelo de Prisma y DTO de HTTP son tres tipos distintos, convertidos con mapeadores. Los tipos de Prisma no salen de `infrastructure`.
5. Un caso de uso por clase, con un único método público `execute`. Nada de servicios gigantes.
6. Los controladores solo validan, llaman a un caso de uso y devuelven la respuesta, sin lógica de negocio.
7. Las transacciones se orquestan en `application` mediante `UnitOfWork`.
8. El dominio lanza errores de dominio tipados; un filtro en `presentation` los traduce a respuestas HTTP uniformes.
9. Un módulo solo importa el `index.ts` público de otro (casos de uso, puertos y eventos). La reacción a hechos de otro módulo se hace con eventos de dominio.
10. Cada módulo es dueño de sus tablas. `reporting` es la excepción: lee todas con consultas de solo lectura y nunca escribe.
11. No instancies servicios con `new` en `domain` ni en `application`; inyéctalos por constructor, incluidos `Clock` e `IdGenerator`.
12. Puertos pequeños y específicos (como guía, máximo 5 métodos). Lecturas separadas de escrituras (`AttentionRepository` y `AttentionQueries`).

Módulos: `identity`, `patients`, `clinical`, `scheduling`, `billing`, `files`, `reporting`, `audit` y `messaging` (reservado: no lo implementes en el MVP).

## 5. TDD y pruebas

- La prueba se escribe antes que el código: rojo, verde, refactor.
- Niveles: dominio (unitarias puras, sin Nest ni base de datos), casos de uso (repositorios en memoria y reloj fijo), infraestructura (PostgreSQL real en contenedor), API (Supertest con permisos por rol).
- Cada endpoint tiene pruebas de permisos por rol.
- Los puertos con más de una implementación tienen una suite de pruebas de contrato que corre contra todas.
- Las pruebas son deterministas: sin hora real, sin dependencia de orden y con las integraciones externas simuladas.
- Cobertura mínima del 80 % global y del 90 % en `domain` y `application`.
- Si una prueba falla, corrige la causa. Nunca la elimines ni la debilites para que pase.

## 6. Seguridad y datos

- Los datos clínicos nunca van en logs, en Sentry ni en URLs.
- La autorización se evalúa en el servidor, por rol, en cada endpoint.
- Los archivos se entregan solo con URL firmada de corta duración; el bucket es privado.
- Los secretos nunca se escriben en el repositorio ni en el código.
- Las fechas se guardan en UTC y se presentan en America/Bogota.
- Los pacientes y las historias clínicas no se eliminan físicamente; las ediciones de una atención cerrada conservan la versión anterior.
- La base admite máximo 20 conexiones: pool de Prisma 5 y de pg-boss 3.
- Mientras se usen planes gratuitos, solo datos de prueba. Nunca cargues datos reales de pacientes.

## 7. Convenciones

- TypeScript estricto, sin `any` explícito salvo excepción comentada. ESLint y Prettier sin errores ni advertencias.
- Complejidad ciclomática máxima de 10 por función.
- Commits con Conventional Commits en español. Cambios de unas 400 líneas como máximo, sin contar código generado.
- Usa los scripts de `package.json` (lint, tipos, pruebas, build). No inventes comandos; si falta un script, propón crearlo.
- No instales dependencias fuera del stack sin proponerlo y esperar aprobación.
- Si cambia el contrato, regenera el documento OpenAPI en el mismo change.
- No hagas commit ni push salvo que el desarrollador lo pida.

## 8. Alcance del MVP

La columna MVP del documento de requerimientos manda. Por defecto, no entran al MVP y no deben implementarse ni dejarse a medias: mensajería de WhatsApp, asistente de IA, recordatorios y correos automáticos, agendamiento público, seguimiento automático, recuperación de contraseña y doble factor, abonos y exportaciones. Si dudas de un requisito, consulta su fila en el documento.

## 9. Cómo trabajar con el desarrollador

- El desarrollador está aprendiendo Clean Architecture y TDD. En el módulo de referencia (`patients`) explica cada capa y cada decisión en el `design.md`, y responde preguntas con ejemplos del propio change.
- Cuando se te pida, muestra primero la prueba que falla y espera confirmación antes de escribir el código.
- Prefiere cambios pequeños y revisables. Resume qué hiciste y qué falta al terminar cada tarea.
- Avisa si una decisión merece un ADR (`docs/adr/`).

## 10. Antes de marcar algo como terminado

- Prueba escrita primero y en verde; lint y tipos sin errores; cobertura sin bajar de los umbrales.
- Documento OpenAPI actualizado y change enlazado a sus IDs de requisito.
- La regla de dependencia entre capas sigue intacta.