# ADR 0001: Adopción de Clean Architecture y Kernel Compartido (Shared Kernel)

- **Estado:** Aceptado
- **Fecha:** 2026-10-13
- **Autores:** Equipo de Desarrollo / Sistema Odontológico
- **Requisitos vinculados:** RNF-B-001, RNF-B-005, RNF-B-009, RNF-B-032, RNF-B-045, RC-012, RC-013, RC-014, RC-015, RC-016, RC-017, RC-023, RC-054, RC-072.

---

## 1. Contexto y Problemática

El consultorio odontológico de la Dra. Angelee Pacheco requiere un sistema de gestión confiable, seguro y mantenible a largo plazo, capaz de operar inicialmente con 1 a 3 usuarios simultáneos en una arquitectura de monolito modular basada en NestJS, TypeScript estricto y PostgreSQL.

Los principales desafíos y restricciones de diseño son:
1. **Independencia del negocio respecto al framework y la base de datos:** Las reglas clínicas (estados de piezas dentales, historia clínica inmutable, cálculos de cotizaciones, validaciones de permisos) no deben estar acopladas a Prisma, NestJS ni librerías de infraestructura (RC-012).
2. **Determinismo en pruebas (TDD):** El código de dominio y casos de uso debe poder probarse de forma unitaria pura, rápida e independiente de la hora del sistema (`new Date()`) o generadores aleatorios (`randomUUID()`), cumpliendo los umbrales de cobertura $\ge 90\%$ en `domain`/`application` (RC-002) y $\ge 80\%$ global (RC-001).
3. **Manejo de zonas horarias y fechas:** La base de datos almacena fechas en UTC pero las operaciones clínicas (citas, límites de día, horas de atención) deben evaluarse en la zona horaria legal de Colombia (`America/Bogota`, UTC-5) (RNF-B-045, RC-054).
4. **Seguridad y confidencialidad clínica estricta:** Los datos clínicos y credenciales nunca deben registrarse en texto plano en los logs de la aplicación ni en los reportes de telemetría y monitoreo (Sentry) (RC-023).
5. **Aislamiento modular y multitenancy:** Cada tabla debe contener `clinicId` desde el inicio (RNF-B-032) y un módulo solo puede interactuar con otro a través de su API pública (`index.ts`) o mediante eventos de dominio desacoplados (RC-017).

---

## 2. Decisión

Se adopta **Clean Architecture** estructurada en 4 capas concéntricas para todos los módulos del backend (`domain`, `application`, `infrastructure`, `presentation`), complementada con un **Kernel Compartido (`Backend/src/shared/`)**:

### 2.1. Estructura de Capas
- **`domain`:** Contiene entidades, agregados (`AggregateRoot`), eventos de dominio (`DomainEvent`), errores tipados (`DomainError`) y puertos de repositorios o servicios puros. Prohibida toda importación de NestJS, Prisma, librerías externas o utilidades globales no inyectadas.
- **`application`:** Contiene casos de uso (un caso de uso por clase con método público `execute`), comandos, consultas y puertos de infraestructura (`ClockPort`, `IdGeneratorPort`, `UnitOfWorkPort`, `EventBusPort`). Solo depende de `domain` (con la excepción pragmática de `@Injectable()` e `@Inject()` de NestJS para inyección de dependencias).
- **`infrastructure`:** Contiene los adaptadores que implementan los puertos (`SystemClockAdapter`, `UuidGeneratorAdapter`, `PrismaUnitOfWorkAdapter`, `NestEventBusAdapter`), los repositorios Prisma, los mapeadores de persistencia y la configuración de observabilidad (Pino, Sentry).
- **`presentation`:** Contiene los controladores REST, DTOs con validación estricta (`class-validator`), filtros globales (`DomainExceptionFilter`) y guards de autorización.

### 2.2. Componentes del Kernel Compartido (`src/shared/`)
1. **Errores de Dominio:** Clase abstracta `DomainError` con categorías semánticas (`VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVARIANT_VIOLATION`), traducidas automáticamente por `DomainExceptionFilter` a los estados HTTP correspondientes (400, 401, 403, 404, 409, 422).
2. **Abstracción Transaccional (`UnitOfWorkPort`):** Implementada mediante `AsyncLocalStorage` en `PrismaService`, lo que permite abrir transacciones atómicas desde los casos de uso sin que la capa de aplicación conozca los tipos o la API de Prisma.
3. **Reloj Determinista (`ClockPort`):** Implementado por `SystemClockAdapter` con evaluación de fechas en `America/Bogota` mediante `Intl.DateTimeFormat`.
4. **Trazabilidad (`CorrelationIdMiddleware`):** Middleware global que genera o propaga la cabecera `x-correlation-id` en todas las peticiones HTTP y respuestas, correlacionando logs y trazas de error.
5. **Redacción Clínica en Observabilidad:** Rutas de redacción configuradas en `pinoHttp` y función pura `sanitizeSentryEvent` para censurar con `"[REDACTED]"` campos como `diagnosis`, `notes`, `privateNotes`, `antecedents`, `findings`, `odontogram`, `documentNumber`, `phone` y credenciales.
6. **Verificación Estática de Dependencias:** Uso de `dependency-cruiser` (`pnpm deps:check`) en el pipeline de CI para asegurar que ninguna capa interna importe código de capas externas.

---

## 3. Consecuencias

### 3.1. Positivas
- **Alta testabilidad y velocidad de pruebas:** Los casos de uso y el dominio se prueban con repositorios en memoria (`InMemory*Repository`) y relojes fijos (`MockClock`), permitiendo suites unitarias deterministas que se ejecutan en milisegundos.
- **Mantenibilidad e independencia tecnológica:** Si en el futuro se migra una base de datos o un servicio externo (ej. Cloudflare R2, Google Calendar), solo se modifica el adaptador en `infrastructure` sin afectar la lógica de negocio.
- **Cumplimiento normativo y de seguridad:** Privacidad por diseño garantizada en el núcleo de observabilidad y trazabilidad completa de peticiones.
- **Contrato OpenAPI claro:** Controladores delgados que exponen interfaces limpias y documentadas con `@nestjs/swagger`.

### 3.2. Negativas / Trade-offs y Mitigaciones
- **Mayor número de archivos y clases:** Requiere interfaces de puerto, adaptadores y mapeadores entre modelos de base de datos, entidades de dominio y DTOs de transporte.
  - *Mitigación:* Se implementa un generador de scaffolding con Plop (`plopfile.js`) que automatiza la creación de la estructura estándar para cada nuevo módulo.
- **Curva de aprendizaje para nuevos desarrolladores:**
  - *Mitigación:* Se documenta el módulo de referencia (`patients`) con explicaciones detalladas en su `design.md`, este ADR fundacional y el glosario de términos.
