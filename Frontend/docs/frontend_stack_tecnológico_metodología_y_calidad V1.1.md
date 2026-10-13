# Stack tecnológico, metodología y requisitos de calidad – Frontend

Oct 13, 2026 · @Perez (Versión 1.1 – Auditada y alineada con OpenSpec)

Este documento fija el stack tecnológico, la arquitectura, la metodología y los requisitos de calidad del frontend del Sistema de Gestión Odontológica, con la justificación de cada elección. Deriva del documento de Requerimientos del Frontend; el backend tiene su propio documento. Las decisiones son las vigentes; lo que sigue abierto está en la sección 10.

## 1. Alcance y estado

- Cubre la aplicación web (PWA), su arquitectura, su hosting, el CI/CD y la calidad del frontend.
- El dispositivo principal es el iPad (horizontal y vertical, con Apple Pencil); también funciona en computador y celular.
- El hosting corresponde a la etapa de desarrollo con planes gratuitos; qué se mantiene en producción se decide después.
- Los requisitos de origen se citan por su ID (RF-F y RNF-F). El repositorio, la metodología de trabajo con OpenSpec y la ruta de construcción son comunes con el backend.

## 2. Decisiones y justificación

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| TypeScript en modo estricto | Los tipos se comparten con la API mediante el cliente generado desde OpenAPI; los errores aparecen al compilar | JavaScript sin tipos |
| React + Vite como PWA | Es una aplicación tras inicio de sesión, sin necesidad de SEO, usada desde un iPad y con API propia; la PWA se instala y soporta modo sin conexión; Vite ofrece builds rápidos y hosting estático casi gratuito | Next.js (sección 3) |
| TanStack Router | Rutas tipadas y carga diferida por pantalla para respetar el límite de 300 KB (RC-032) | React Router, equivalente válido |
| TanStack Query con persistencia local | Caché, reintentos y lectura sin conexión de la agenda del día y pacientes citados (RNF-F-031) | Redux, más código para el mismo resultado |
| Zustand, solo para lo mínimo | Estado de interfaz pequeño (estado de sincronización, filtros visuales, bloqueo/difuminado) sin arquitectura pesada | Redux |
| React Hook Form + Zod | Formularios largos como la historia clínica, con validación clara y borradores | Formik |
| Tailwind CSS + shadcn/ui (Radix) | Componentes accesibles por teclado y lector de pantalla, fáciles de adaptar a zonas táctiles de 44 × 44 puntos; el código queda en el proyecto, sin dependencia pesada | Material UI, Ant Design |
| FullCalendar (día, semana, mes y arrastrar y soltar) | Evita construir un calendario con arrastrar y soltar táctil y de ratón desde cero (RF-F-032) | Calendario propio |
| Odontograma propio en SVG con Pointer Events | Ninguna librería cubre la simbología de la doctora; SVG escala bien, responde a 60 FPS en el iPad y se exporta al PDF | Canvas (Konva), menos accesible |
| signature\_pad | Captura la firma de consentimientos informados en el MVP con dedo o Apple Pencil mediante Pointer Events (RF-F-090, RF-F-091) | Firma propia |
| react-zoom-pan-pinch | Zoom y gestos táctiles para radiografías | Visor propio |
| Recharts | Gráficos simples y legibles para el tablero de reportes | Chart.js |
| vite-plugin-pwa (Workbox) | Aplicación instalable, caché de recursos y aviso de actualización, directo con Vite | Serwist con Next.js |
| Dexie (IndexedDB) | Borradores y cola de cambios pendientes de sincronizar (RNF-F-030), con más capacidad que localStorage | localStorage |
| Vitest, Testing Library, MSW y Playwright | Pruebas rápidas de componentes; MSW simula la API; Playwright con WebKit se parece a Safari en iPadOS | Jest, más lento en un proyecto Vite |
| Cloudflare para el hosting | Archivos estáticos sin cobro de ancho de banda en el plan gratuito; mismo proveedor que R2 y el DNS; construye desde el monorepo indicando la carpeta `Frontend` | Vercel o Netlify, también válidos |
| Sentry | Errores del cliente con alertas, sin datos clínicos (RNF-F-054) | Sin monitoreo |

## 3. Por qué React + Vite y no Next.js

Next.js resulta cómodo porque trae resuelto el enrutamiento por carpetas, el renderizado en servidor, la optimización de imágenes, las rutas de API y el despliegue. Esas ventajas pesan en sitios públicos que deben aparecer en buscadores. Este sistema es lo contrario: una aplicación tras inicio de sesión, usada desde un iPad y con un backend propio en NestJS, por lo que casi ninguna de esas ventajas aplica y algunas estorban.

| Criterio | Next.js | React + Vite (SPA / PWA) |
| --- | --- | --- |
| Curva de aprendizaje | Ya se conoce | Poco mayor: es React, pero el enrutador y la configuración son explícitos |
| SEO y renderizado en servidor | Sí | No; no se necesita porque todo está tras inicio de sesión |
| Modo sin conexión y PWA | Posible, pero hay que lidiar con componentes de servidor y caché | Directo con vite-plugin-pwa; todo corre en el navegador |
| Hosting y costo | Pide un servidor Node, o exportar estático perdiendo funciones | Archivos estáticos en una CDN, casi sin costo |
| Superficie de seguridad | Una pieza más con servidor que proteger | Solo la API protegida |
| Velocidad de desarrollo | Buena | Servidor de desarrollo y builds muy rápidos |
| Rutas de API integradas | Ya existe NestJS; quedarían sin uso | No aplica |

Next.js sí tendría sentido para la página pública de agendamiento de la segunda fase (RF-B-066), si se quisiera que los buscadores la indexen; sería un proyecto aparte.

## 4. Arquitectura del frontend

### 4.1 Clean Architecture por feature

Cada feature (`auth`, `patients`, `odontogram`, `attention`, `appointments`, `files`, `quotes`, `payments`, `reports`, `settings`) aplica las cuatro capas completas, igual que los módulos del backend y con la misma regla de dependencia: las capas externas dependen de las internas y nunca al revés.

| Capa | Contiene | Puede depender de | No puede depender de |
| --- | --- | --- | --- |
| domain | Entidades, objetos de valor y reglas puras (reglas del odontograma, cálculo de cotizaciones, cola de cambios pendientes) y los puertos (interfaces) | Solo de `shared/domain` | React, TanStack Query, `fetch`, Dexie o cualquier librería |
| application | Casos de uso como clases o funciones puras (`CloseAttentionUseCase`, `AddToothFindingUseCase`, `BuildQuoteUseCase`) que usan puertos | domain y `shared/application` | infrastructure, presentation y React |
| infrastructure | Adaptadores de los puertos: cliente de API generado desde OpenAPI, repositorios HTTP, almacenamiento local con Dexie, subida de archivos, cámara y mapeadores entre DTO y entidades | application, domain y `shared` | presentation |
| presentation | Componentes React, rutas, formularios (React Hook Form + Zod) y hooks de cada feature que envuelven los casos de uso con TanStack Query | application y los tipos de domain | infrastructure |

Reglas obligatorias:

1. **Regla de dependencia:** los imports solo apuntan hacia adentro; `eslint-plugin-boundaries` la verifica en el CI.
2. **Domain y application son TypeScript puro:** no importan React, TanStack Query, `fetch` ni Dexie.
3. **Ensamblaje en un solo lugar por feature:** el archivo `<feature>.container.ts` crea los casos de uso con sus adaptadores y los expone a la interfaz mediante un proveedor de React en `app/`.
4. **Tres modelos distintos:** el DTO generado de OpenAPI, la entidad de dominio y las props de los componentes, convertidos con mapeadores en infrastructure.
5. **Componentes sin acceso directo a datos:** no llaman a `fetch` ni a casos de uso; usan los hooks de su feature, que son delgados y solo gestionan caché y estado de carga.
6. **Entre features:** una feature solo importa de otra su `index.ts` público.
7. **Plantillas de generación:** Plop crea la estructura de una feature o de un caso de uso con sus archivos y su prueba.
8. **Idioma del código:** inglés, con el mismo glosario del backend (`Backend/docs/glosario.md`). Los textos visibles al usuario viven centralizados en `Frontend/src/shared/i18n/es-CO.ts` (RNF-F-053).
9. **Revisión:** al cierre del MVP se evalúa en un ADR el costo de la estructura completa en las features de solo lectura.

### 4.2 Principios SOLID en el frontend

| Principio | Cómo se aplica |
| --- | --- |
| S, responsabilidad única | Un caso de uso por archivo; un componente o hook con una sola responsabilidad; el que obtiene datos se separa del que solo los dibuja. |
| O, abierto y cerrado | El catálogo de hallazgos del odontograma se extiende sin editar el componente; un nuevo almacenamiento local es un nuevo adaptador del mismo puerto. |
| L, sustitución de Liskov | Cada adaptador cumple el contrato completo de su puerto; una suite de contrato corre contra el adaptador real (HTTP con MSW, Dexie con fake-indexeddb) y contra el de memoria. |
| I, segregación de interfaces | Puertos pequeños y separados (`AttentionRepository`, `DraftStore`, `FileUploader`); props mínimas: un componente recibe lo que dibuja, no el objeto completo. |
| D, inversión de dependencias | Los casos de uso dependen de puertos inyectados desde el ensamblaje; los componentes dependen de hooks. Las pruebas sustituyen los adaptadores sin tocar el código. |

### 4.3 Estructura

```
Frontend/src/
  app/             enrutador, proveedores, tema, App Shell, protector de privacidad
  features/
    auth/          inicio de sesión, sesión actual, permisos por rol
    patients/      búsqueda global, listado, ficha por pestañas, duplicados
    attention/     historia clínica guiada, atención rápida (< 2 min), materiales, cierre
    odontogram/    odontograma SVG interactivo 60 FPS, instantáneas, undo/redo
    appointments/  tablero Hoy, agenda FullCalendar (drag & drop), disponibilidad
    files/         cámara, galería, visor de radiografías, firma de consentimientos
    quotes/        constructor de cotizaciones, vista previa, compartir PDF
    payments/      cobro al cerrar atención, historial y saldo
    reports/       tablero financiero y operativo con Recharts
    settings/      perfil del consultorio, usuarios, catálogos y stock de materiales
  shared/
    ui/            componentes base (botones, tablas, diálogos con zonas >= 44x44 pt)
    api/           cliente generado desde OpenAPI (Backend/openapi.json)
    offline/       instancia de Dexie, cola de sincronización, indicador de guardado
    i18n/          textos centralizados en español de Colombia (es-CO)
    lib/           fechas (UTC <-> America/Bogota), formato de moneda COP, utilidades

features/attention/
  domain/
    attention.ts                    entidad
    tooth-finding.ts                objeto de valor
    attention.repository.ts         puerto
    draft-store.port.ts             puerto
  application/
    close-attention.use-case.ts
    add-tooth-finding.use-case.ts
  infrastructure/
    http-attention.repository.ts    usa el cliente generado
    dexie-draft-store.ts
    attention.mapper.ts
  presentation/
    use-close-attention.ts          hook con TanStack Query
    AttentionPage.tsx
    OdontogramView.tsx
  attention.container.ts            ensamblaje
  index.ts                          API pública de la feature
```

### 4.4 Contrato con la API

- El cliente de la API se genera a partir del documento `Backend/openapi.json`; un cambio incompatible rompe el build y no la consulta de la doctora.
- Los textos de la interfaz están centralizados (RNF-F-053).
- Las fechas llegan en UTC y se muestran en America/Bogota (RNF-B-045).
- Durante el desarrollo se usa la API real; MSW se usa solo en las pruebas automáticas.

## 5. PWA e iPad

- **iPad primero:** la experiencia en iPad horizontal y vertical se diseña antes que la de computador. Se usan Pointer Events, que distinguen dedo y Apple Pencil, y zonas táctiles de al menos 44 × 44 puntos (RNF-F-004).
- **Límites de las PWA en iPadOS, asumidos de forma explícita:** las notificaciones push solo funcionan si la doctora instala la aplicación en la pantalla de inicio; Safari no ofrece sincronización en segundo plano, así que los cambios pendientes se envían cuando la aplicación está abierta; y el almacenamiento local puede ser más limitado que en computador, por lo que solo se guarda lo mínimo. Si estos límites resultaran bloqueantes, Capacitor envuelve la misma aplicación web en una app nativa sin reescribirla.
- **Modo sin conexión:** la agenda del día y las fichas de los pacientes citados se leen sin conexión (solo lectura), y lo digitado se conserva en IndexedDB (Dexie) hasta sincronizarse. La interfaz muestra siempre el estado de guardado (`Guardado`, `Guardando…`, `Pendiente de sincronizar`, RNF-F-032).
- **Privacidad en pantalla (RNF-F-042):** cuando la aplicación pierde el foco o pasa a segundo plano (`visibilitychange` / `blur`), el App Shell aplica un difuminado (`backdrop-blur`) sobre los datos clínicos para proteger la vista previa del selector de apps del iPad.
- **Fotos y consentimientos:** captura de fotos clínicas y de consentimientos físicos con la cámara del iPad, conversión de HEIC a JPEG y compresión en el cliente antes de subir directo a R2 con URL firmada. La firma digital de consentimientos se captura en pantalla completa con `signature_pad`.
- **Pruebas en dispositivo real:** todo el trabajo de interfaz se prueba en un iPad real desde el primer prototipo.

## 6. Hosting y entornos

| Entorno | Frontend | API a la que apunta | Datos |
| --- | --- | --- | --- |
| Local | Servidor de desarrollo de Vite | API local en Docker | Ficticios |
| Desarrollo (nube) | Cloudflare (Workers con archivos estáticos o Pages) | API en Render, plan gratuito | Solo de prueba |
| Producción | Cloudflare | API definitiva, por definir | Reales |

- El frontend y la API usan subdominios del dominio de la doctora (por ejemplo, `app.` y `api.`), lo que simplifica las cookies y el CORS.
- Cloudflare construye `Frontend` con esa carpeta como directorio raíz y se despliega al fusionar en `main`.
- **Arranque en frío de la API gratuita:** el servicio de Render puede tardar de 30 a 60 segundos en despertar. Mientras dure el plan gratuito, la aplicación muestra un estado claro de espera («Conectando con el servidor…») y reintenta, en lugar de un error. El keep-alive del backend reduce el problema.
- Las variables de entorno del frontend (como la URL de la API) se inyectan en el build; nunca incluyen secretos.

## 7. Control de versiones y metodología

### 7.1 Repositorio y proceso con OpenSpec

El frontend vive en `Frontend` dentro del monorepo compartido con el backend (pnpm workspaces, en GitHub). Se elige un solo repositorio para que el cliente generado desde OpenAPI se mantenga sincronizado con la API y para que cualquier ajuste de contrato que aparezca al construir una pantalla se resuelva en un único pull request. Lo que aplica al frontend:

- `main` protegida, sin push directo y con fusión solo con el CI en verde.
- Ramas cortas, commits con Conventional Commits (commitlint) y Husky con lint-staged antes de cada commit.
- Cada PR enlaza al requisito que implementa (RF-F-053, por ejemplo) mediante una plantilla.
- El CI filtra por rutas para correr solo lo que cambió en `Frontend/**`; Dependabot está activo.
- **Proceso Spec-Driven (OpenSpec):** el frontend se construye después del backend completo, mediante los 14 *changes* definidos en `PLAN-MAESTRO-OPENSPEC.md` dentro de `Frontend/openspec/changes/`; cada módulo se prueba contra la API real y se cierra con una demostración a la doctora en su iPad. Backlog en GitHub Projects por ID de requisito y decisiones en ADR (`Frontend/docs/adr/`).
- Banderas de función: la mensajería queda oculta en el MVP (la navegación y la ficha del paciente no muestran Mensajes) hasta que se active en la segunda fase.

### 7.2 TDD y niveles de prueba

Ciclo: prueba que falla, código mínimo que la pasa, refactor. Clean Architecture permite probar las reglas sin React.

| Nivel | Qué se prueba | Cómo |
| --- | --- | --- |
| Dominio y casos de uso | Reglas del odontograma, cálculo de cotizaciones, cola de cambios pendientes, flujos como cerrar una atención | Vitest sin React, con puertos en memoria como dobles |
| Infraestructura | Adaptadores HTTP y de almacenamiento local | MSW para la API, fake-indexeddb para Dexie y suite de contrato |
| Componentes | Odontograma, formulario de atención, agenda, consentimientos, cobros | Vitest y Testing Library, con axe para accesibilidad |
| Extremo a extremo | Flujos críticos y desconexión offline | Playwright en WebKit (parecido a Safari) y Chromium |

### 7.3 Definición de terminado (por cada Change de OpenSpec)

- Los artefactos de OpenSpec (`proposal.md`, `design.md`, `specs/`, `tasks.md`) están completos y validados.
- La prueba se escribió antes o junto con el código (TDD).
- El CI está en verde y la cobertura no baja de los umbrales (90 % en domain/application, 80 % global).
- El cliente de la API está regenerado y el build compila bajo el presupuesto de 300 KB comprimidos.
- Sin violaciones críticas o serias de axe en las pantallas tocadas.
- Si toca la interfaz, se probó en el iPad.
- El PR enlaza al requisito, fue revisado con la lista de verificación y el *change* fue sincronizado (`opsx-sync`) y archivado (`opsx-archive`).

## 8. Pipeline de CI/CD

Se ejecuta en cada push y en cada pull request (`.github/workflows/frontend-ci.yml`), en GitHub Actions.

| Paso | Herramienta | Criterio de fallo |
| --- | --- | --- |
| Instalación | pnpm con archivo de bloqueo congelado y caché | Archivo de bloqueo desactualizado |
| Lint y formato | ESLint y Prettier | Cualquier error o advertencia |
| Tipos | `tsc --noEmit` en modo estricto | Cualquier error |
| Arquitectura | eslint-plugin-boundaries | Violación de la regla de dependencia |
| Pruebas unitarias y de componentes | Vitest, con cobertura y axe | Prueba fallida, cobertura bajo el umbral o violación de axe |
| Contrato | Regeneración del cliente desde OpenAPI (`Backend/openapi.json`) | Cambios sin confirmar o frontend que no compila |
| Build | Vite, con presupuesto de tamaño | Error o JavaScript inicial sobre 300 KB comprimidos |
| Seguridad | `pnpm audit --prod` y escaneo de secretos de GitHub | Vulnerabilidad alta o crítica, o secreto detectado |
| E2E | Playwright, solo en PR hacia `main` | Flujo crítico fallido |
| Despliegue | Cloudflare, al fusionar en `main` | Cualquier paso anterior en rojo |

## 9. Requisitos de calidad

La columna Bloquea indica si el incumplimiento impide fusionar el cambio.

### 9.1 Pruebas y cobertura

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-001 | Cobertura mínima del 80 % en líneas, ramas, funciones y sentencias en el frontend. | Umbral en Vitest | Sí |
| RC-002 | Cobertura mínima del 90 % en domain y application de cada feature. | Umbral por carpeta | Sí |
| RC-003 | Toda regla de negocio nueva se escribe con TDD. | Lista de verificación del PR | Sí |
| RC-004 | Las pruebas son deterministas: sin dependencia de la hora real, del orden ni de la red; la API se simula con MSW. | Ejecución repetida en CI | Sí |
| RC-006 | Hay una prueba E2E por flujo crítico: crear paciente, registrar atención con material, marcar el odontograma, agendar cita y cobrar. | Playwright | Sí |
| RC-007 | El pipeline completo tarda menos de 10 minutos. | Tiempo del workflow | No |

### 9.2 Código y arquitectura

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-010 | Cero errores y cero advertencias de ESLint; formato con Prettier. | CI | Sí |
| RC-011 | TypeScript estricto y sin `any` explícito, salvo excepción comentada. | `tsc` y regla `no-explicit-any` | Sí |
| RC-013 | Complejidad ciclomática máxima de 10 por función. | Regla `complexity` de ESLint | Sí |
| RC-014 | Los pull requests modifican alrededor de 400 líneas como máximo, sin contar código generado. | Revisión | No |
| RC-017 | Una feature solo importa de otra su `index.ts` público. | eslint-plugin-boundaries | Sí |
| RC-018 | Cada puerto con más de una implementación tiene una suite de pruebas de contrato que corre contra todas ellas. | Pruebas de contrato en CI | Sí |
| RC-019 | Domain y application no importan React, TanStack Query, `fetch` ni Dexie, y los componentes no llaman a `fetch` ni a casos de uso directamente. | eslint-plugin-boundaries | Sí |

### 9.3 Seguridad

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-020 | Sin vulnerabilidades altas ni críticas en dependencias de producción. | `pnpm audit --prod` | Sí |
| RC-021 | Escaneo de secretos con protección de push activos; ningún secreto en el repositorio ni en las variables del build. | GitHub | Sí |
| RC-022 | Alertas de Dependabot de seguridad atendidas en menos de 7 días. | Revisión semanal | No |
| RC-023 | Datos clínicos nunca en logs del cliente, en Sentry ni en URLs (RNF-F-054). | Revisión y pruebas | Sí |
| RC-025 | Antes de producción: política de seguridad de contenido (CSP) y cabeceras verificadas en el hosting, revisión de XSS (RNF-F-044), y datos sensibles ocultos en la vista previa al cambiar de aplicación (RNF-F-042). | Informe documentado | Criterio de producción |

### 9.4 Rendimiento

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-032 | JavaScript inicial de 300 KB comprimidos como máximo; el resto con carga diferida. | Presupuesto de tamaño en el build | Sí |
| RC-033 | Lighthouse móvil con rendimiento mínimo de 85 en Hoy y Agenda (RNF-F-020). | Lighthouse CI | No |
| RC-034 | Odontograma a 60 cuadros por segundo en el iPad (RNF-F-022). | Prueba manual en cada demostración | No |

### 9.5 Accesibilidad y usabilidad

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-040 | Cero violaciones críticas o serias de axe en las pantallas principales. | Pruebas automatizadas | Sí |
| RC-041 | Contraste y tamaño de texto conformes con WCAG 2.1 AA (RNF-F-011). | axe y Lighthouse, con puntaje de accesibilidad mínimo de 90 | No |
| RC-042 | Zonas táctiles de al menos 44 × 44 puntos (RNF-F-004). | Revisión en el iPad | No |
| RC-043 | Una atención completa en menos de 2 minutos y 10 toques (RNF-F-001). | E2E y medición con la doctora en cada demostración | No |

### 9.6 Confiabilidad

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-054 | Fechas recibidas en UTC y presentadas en America/Bogota, con pruebas en cambios de día. | Pruebas unitarias | Sí |
| RC-056 | Sin conexión, lo digitado se conserva y se sincroniza al volver; el estado de guardado es siempre visible (RNF-F-030, RNF-F-032). | E2E con red simulada | Sí |

### 9.7 Observabilidad

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-060 | Sentry activo en la aplicación, con alertas al desarrollador y sin datos clínicos. | Evento de prueba | No |

### 9.8 Documentación y proceso

| ID | Requisito | Verificación | Bloquea |
| --- | --- | --- | --- |
| RC-070 | El cliente del frontend se regenera desde OpenAPI en cada cambio de la API. | Paso de contrato del CI | Sí |
| RC-071 | El README permite arrancar el proyecto local en menos de 15 minutos. | Revisión en cada iteración | No |
| RC-072 | Cada decisión de arquitectura queda en un ADR. | Revisión del PR | No |
| RC-073 | Cada PR enlaza al requisito que implementa. | Plantilla de PR | Sí |
| RC-074 | Commits con Conventional Commits. | commitlint | Sí |
| RC-075 | `main` protegida y fusión solo con el CI en verde. | Protección de rama | Sí |
| RC-076 | Demostración a la doctora al cierre de cada iteración, con su retroalimentación registrada. | Acta de la reunión | No |

## 10. Riesgos y pendientes

### Riesgos

- **PWA en iPadOS:** notificaciones push y almacenamiento limitados, sin sincronización en segundo plano. Mitigación: pruebas con iPad real desde el primer prototipo y Capacitor como alternativa.
- **Odontograma interactivo:** es la pieza más compleja y la más distintiva. Mitigación: prototipo temprano validado con la doctora y su simbología.
- **Adopción:** si registrar toma más tiempo que hoy, la doctora volverá a abandonarlo. Mitigación: medir con el criterio RC-043 en cada demostración.
- **Arranque en frío de la API gratuita:** puede tardar de 30 a 60 segundos. Mitigación: estado de espera claro y keep-alive del backend.
- **Costo de la estructura completa de Clean Architecture:** más código por feature. Mitigación: Plop, una feature de referencia (`patients`) y revisión al cierre del MVP.

### Pendientes

- Simbología y colores exactos del odontograma que prefiere la doctora (norma estándar o personalizada).
- Modelo de iPad y si usará Apple Pencil.
- Identidad visual del consultorio y de la página web existente, para mantener coherencia.
- Textos de los consentimientos informados por procedimiento.
- Confirmar qué pestañas de la ficha clínica ve la auxiliar en modo lectura (notas privadas y cobros quedan ocultos).
- Región y precios de hosting, que se confirman en el documento de Backend.