# AGENTS.md – Frontend

Instrucciones para asistentes de IA que trabajan en este directorio (`Frontend/`). Léelas completas al iniciar cada sesión. Responde y redacta en español; el código (componentes, funciones, variables, rutas) va en inglés.

## 1. Proyecto

Sistema de gestión para el consultorio de una odontóloga independiente (1 a 3 usuarios). Este directorio es la aplicación web (PWA): React, TypeScript estricto y Vite, TanStack Router y TanStack Query, Zustand solo para lo mínimo, React Hook Form con Zod, Tailwind CSS con shadcn/ui, Dexie para el modo sin conexión, Vitest, Testing Library, MSW y Playwright.

Uso principal en iPad (horizontal y vertical, con Apple Pencil); también computador y celular. El backend está en `../Backend` con su propio OpenSpec y es dueño de las reglas de negocio y del contrato OpenAPI. Aquí no se duplican reglas de negocio.

## 2. Documentos de referencia (`docs/`)

- `docs/Requerimientos Frontend – Sistema de Gestión Odontológica.md`: qué construir (RF-F y RNF-F). La columna MVP manda.
- `docs/Frontend - Stack tecnológico, metodología y calidad.md`: cómo construirlo (arquitectura, PWA, metodología y requisitos de calidad RC).

No cargues los documentos completos. Lee solo las secciones que necesita el change:

| Necesitas | Dónde |
|---|---|
| Acceso, navegación, pantalla Hoy, agenda | Requerimientos, secciones 3.1 a 3.3 |
| Pacientes, historia clínica y atención | Requerimientos, secciones 3.4 y 3.5 |
| Odontograma interactivo | Requerimientos, sección 3.6 |
| Fotos y archivos, consentimientos y firma | Requerimientos, secciones 3.7 y 3.8 |
| Cotizaciones, cobros, reportes, configuración | Requerimientos, secciones 3.10 a 3.13 |
| Usabilidad, accesibilidad, rendimiento, conectividad, seguridad del cliente | Requerimientos, sección 4 |
| Flujos principales y mapa de pantallas | Requerimientos, secciones 5 y 6 |
| Capas y reglas de Clean Architecture, SOLID, estructura | Stack, secciones 4.1 a 4.3 |
| Contrato con la API | Stack, sección 4.4 |
| PWA e iPad | Stack, sección 5 |
| TDD y definición de terminado | Stack, secciones 7.2 y 7.3 |
| Requisitos de calidad (RC) | Stack, sección 9 |

Si un requisito contradice a los documentos, falta información o es ambiguo, pregunta antes de continuar. No inventes requisitos.

## 3. Flujo de trabajo con OpenSpec

1. Un change por rebanada vertical, con nombre en kebab-case. Si existe el change del backend con el mismo nombre, cítalo como fuente de las reglas de negocio y no las repitas.
2. Orden: explore, propose, revisión humana, apply, archive. Las reglas de cada artefacto están en `openspec/config.yaml`; síguelas.
3. No implementes nada hasta que el desarrollador apruebe el proposal, las specs y el design.
4. Cita siempre los IDs de requisito (RF-F, RNF-F y RC).
5. Trabaja un solo change a la vez y no toques código fuera de su alcance.
6. No modifiques `docs/` ni `openspec/config.yaml` salvo petición expresa.
7. Este frontend se archiva después del change del backend con el mismo nombre.

## 4. Arquitectura (no negociable)

Clean Architecture completa en CADA feature (`patients`, `odontogram`, `attention`, `appointments`, `files`, `quotes`, `payments`, `reports`, `settings`), con cuatro capas:

- `domain`: entidades, objetos de valor, reglas puras (reglas del odontograma, cálculo de cotizaciones, cola de cambios pendientes) y puertos. TypeScript puro.
- `application`: casos de uso (`CloseAttentionUseCase`, `AddToothFindingUseCase`) que usan puertos. TypeScript puro.
- `infrastructure`: adaptadores de los puertos (cliente de API generado desde OpenAPI, repositorios HTTP, almacenamiento local con Dexie, cámara, subida de archivos) y mapeadores.
- `presentation`: componentes React, rutas, formularios y hooks de la feature que envuelven los casos de uso con TanStack Query.

Reglas:

1. Las dependencias solo apuntan hacia adentro.
2. `domain` y `application` no importan React, TanStack Query, `fetch` ni Dexie.
3. Los componentes no llaman a `fetch` ni a casos de uso directamente: usan los hooks de su feature, que son delgados y solo gestionan caché y estado de carga.
4. El ensamblaje (casos de uso con sus adaptadores) está en un solo archivo `<feature>.container.ts`, expuesto a la interfaz mediante un proveedor de React en `app/`.
5. DTO generado de OpenAPI, entidad de dominio y props de los componentes son tres modelos distintos, convertidos con mapeadores en `infrastructure`.
6. Una feature solo importa el `index.ts` público de otra.
7. Principios SOLID: un caso de uso por archivo; extender sin editar (por ejemplo, el catálogo de hallazgos del odontograma); puertos pequeños (`AttentionRepository`, `DraftStore`, `FileUploader`); props mínimas, un componente recibe lo que dibuja y no el objeto completo.
8. El cliente de la API se genera desde el OpenAPI del backend. Nunca lo escribas a mano ni lo edites.

## 5. TDD y pruebas

- La prueba se escribe antes que el código: rojo, verde, refactor.
- Niveles: dominio y casos de uso (Vitest puro con puertos en memoria), adaptadores (MSW para la API y fake-indexeddb para Dexie), componentes críticos (Testing Library con axe: odontograma, formulario de atención, agenda, cobros) y extremo a extremo (Playwright en WebKit y Chromium).
- Los puertos con más de una implementación tienen una suite de pruebas de contrato.
- Las pruebas son deterministas: sin hora real ni red real; la API se simula con MSW.
- Cobertura mínima del 80 % global y del 90 % en `domain` y `application`.
- Si una prueba falla, corrige la causa. Nunca la elimines ni la debilites para que pase.

## 6. Experiencia de uso (criterios de aceptación)

- Pensado primero para iPad: horizontal y vertical, con dedo y Apple Pencil mediante Pointer Events.
- Zonas táctiles de al menos 44 por 44 puntos y la información nunca depende solo del color.
- Una atención completa debe poder hacerse en menos de 2 minutos y 10 toques.
- Estado de guardado siempre visible. Lo digitado se conserva sin conexión (Dexie) y se sincroniza al volver. La agenda del día se lee sin conexión.
- Accesibilidad WCAG 2.1 AA y cero violaciones críticas o serias de axe en las pantallas principales.
- JavaScript inicial de 300 KB comprimidos como máximo; el resto con carga diferida.
- Textos centralizados, en español de Colombia. Fechas recibidas en UTC y mostradas en America/Bogota.
- La API gratuita puede tardar de 30 a 60 segundos en despertar: muestra un estado claro de espera y reintenta en vez de un error.

## 7. Seguridad y datos

- Los datos clínicos nunca van en logs del cliente, en Sentry ni en URLs.
- No guardes contraseñas ni datos clínicos sin cifrar en el dispositivo; el almacenamiento local es el mínimo necesario.
- Las variables de entorno del build (como la URL de la API) no incluyen secretos.
- Mientras se usen planes gratuitos, solo datos de prueba. Nunca cargues datos reales de pacientes.

## 8. Convenciones

- TypeScript estricto, sin `any` explícito salvo excepción comentada. ESLint y Prettier sin errores ni advertencias.
- Complejidad ciclomática máxima de 10 por función.
- Commits con Conventional Commits. Cambios de unas 400 líneas como máximo, sin contar código generado.
- Usa los scripts de `package.json` (lint, tipos, pruebas, build). No inventes comandos; si falta un script, propón crearlo.
- No instales dependencias fuera del stack sin proponerlo y esperar aprobación.
- No hagas commit ni push salvo que el desarrollador lo pida.

## 9. Alcance del MVP

La columna MVP del documento de requerimientos manda. Por defecto, no entran al MVP y no deben implementarse ni dejarse a medias: la bandeja de Mensajes y el asistente de WhatsApp, las notificaciones push de mensajes, el seguimiento automático, el uso sin conexión ampliado y la firma de consentimientos en pantalla de segunda fase. La navegación del MVP no muestra Mensajes. Las cotizaciones se descargan en PDF y se comparten manualmente. Si dudas de un requisito, consulta su fila en el documento.

## 10. Cómo trabajar con el desarrollador

- El desarrollador está aprendiendo Clean Architecture y TDD. En la feature de referencia (`patients`) explica cada capa y cada decisión en el `design.md`, y responde preguntas con ejemplos del propio change.
- Cuando se te pida, muestra primero la prueba que falla y espera confirmación antes de escribir el código.
- Prefiere cambios pequeños y revisables. Resume qué hiciste y qué falta al terminar cada tarea.
- Si el change toca la interfaz, deja anotado qué debe probarse en un iPad real.
- Avisa si una decisión merece un ADR (`docs/adr/`).

## 11. Antes de marcar algo como terminado

- Prueba escrita primero y en verde; lint, tipos y axe sin errores; cobertura sin bajar de los umbrales.
- Cliente de la API regenerado si cambió el contrato del backend.
- Change enlazado a sus IDs de requisito y regla de dependencia entre capas intacta.