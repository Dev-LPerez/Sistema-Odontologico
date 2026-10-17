# Tasks: add-scheduling-availability-and-appointments

## 1. Capa Domain: Entidades, Value Objects, Errores y Puertos

- [x] 1.1 Crear enumeraciones `AppointmentStatus`, `DayOfWeek` y VO inmutable `TimeSlot` (`startTime`, `endTime`, `durationMinutes`) con validaciones en zona `America/Bogota` (RC-054) y verificar con pruebas unitarias en `src/modules/scheduling/domain/time-slot.vo.spec.ts`.
- [x] 1.2 Crear entidad `WeeklyAvailability` con reglas de horario (inicio >= 09:00 a. m.) y `ScheduleBlock` con validaciones de fechas no vacías, y verificar con pruebas en `weekly-availability.entity.spec.ts` y `schedule-block.entity.spec.ts`.
- [x] 1.3 Crear agregado raíz `Appointment` con máquina de estados estricta y emisión de eventos de dominio (`AppointmentScheduledEvent`, `AppointmentRescheduledEvent`, `AppointmentCancelledEvent`, `AppointmentStatusChangedEvent`), verificando con pruebas en `appointment.aggregate.spec.ts`.
- [x] 1.4 Definir excepciones de dominio tipadas (`AppointmentOverlapConflictException`, `DailyAppointmentsLimitExceededException`, `ScheduleBlockConflictException`, etc.) y puertos `AppointmentRepositoryPort`, `AppointmentQueriesPort`, `AvailabilityRepositoryPort` y `ScheduleBlockRepositoryPort`.
- [x] 1.5 Ejecutar `pnpm --filter backend lint`, `typecheck`, `deps:check` y pruebas unitarias de dominio en verde, realizando commit `feat(scheduling): add domain models, value objects and ports`.

## 2. Capa Infrastructure: Modelos Prisma, Repositorios y Pruebas de Contrato

- [x] 2.1 Agregar modelos `AvailabilityConfig`, `ScheduleBlock` y `Appointment` en `Backend/prisma/schema.prisma` con claves foráneas `onDelete: Restrict` hacia `Clinic`, `Patient` y `Procedure`, y ejecutar `pnpm --filter backend prisma:generate` y migración de desarrollo.
- [x] 2.2 Implementar adaptadores en memoria `InMemoryAppointmentRepository`, `InMemoryAvailabilityRepository` e `InMemoryScheduleBlockRepository`.
- [x] 2.3 Implementar adaptadores Prisma `PrismaAppointmentRepository`, `PrismaAvailabilityRepository` y `PrismaScheduleBlockRepository` con mapeo de `P2002` a `DomainError` de categoría `CONFLICT` (`409`).
- [x] 2.4 Crear suites de contrato `appointment.repository.contract.spec.ts`, `availability.repository.contract.spec.ts` y `schedule-block.repository.contract.spec.ts` contra `InMemory` y contra PostgreSQL real usando `cleanDatabaseForContractTests(prisma)`.
- [x] 2.5 Ejecutar `pnpm --filter backend lint`, `typecheck`, `deps:check` y pruebas de contrato en verde, realizando commit `feat(scheduling): add prisma schema, repositories and contract tests`.

## 3. Capa Application: Casos de Uso y Consultas

- [x] 3.1 Implementar casos de uso de disponibilidad y bloqueos (`ConfigureAvailabilityUseCase`, `GetAvailabilityQuery`, `CreateScheduleBlockUseCase`, `ListScheduleBlocksQuery`) inyectando `ClockPort` e `IdGeneratorPort`, y verificar en `src/modules/scheduling/application/use-cases/*.spec.ts`.
- [x] 3.2 Implementar `ScheduleAppointmentUseCase` con validación estricta de solapamiento, tope diario de citas (máx. 4) y bloqueos activos, verificando con pruebas en `schedule-appointment.use-case.spec.ts`.
- [x] 3.3 Implementar casos de uso del ciclo de vida (`RescheduleAppointmentUseCase`, `CancelAppointmentUseCase`, `ChangeAppointmentStatusUseCase`) y consultas (`GetAppointmentByIdQuery`, `ListAppointmentsQuery`), verificando con pruebas unitarias.
- [x] 3.4 Ejecutar `pnpm --filter backend lint`, `typecheck`, `deps:check` y pruebas de aplicación en verde, realizando commit `feat(scheduling): implement scheduling use cases and queries`.

## 4. Capa Presentation: Controladores REST, DTOs y Pruebas E2E

- [x] 4.1 Crear DTOs con `class-validator` y `SchedulingController` con decoradores `@Roles('ADMIN')` y `@Roles('ADMIN', 'AUXILIARY')` bajo prefijo `/v1/scheduling/`.
- [x] 4.2 Configurar `SchedulingModule` en NestJS ensamblando puertos y adaptadores con tokens de inyección, registrar en `AppModule` y exponer API pública en `src/modules/scheduling/index.ts`.
- [x] 4.3 Implementar suite E2E en `test/scheduling.e2e-spec.ts` inicializando con `configureApp(app)` y verificando los 12 escenarios de `spec.md`:
  - `Administradora configura disponibilidad semanal válida y auxiliar la consulta` -> `it('should configure weekly availability as ADMIN and allow AUXILIARY to view it')`
  - `Rechazo por hora de inicio anterior a las 09:00 a. m. o tope fuera de rango` -> `it('should reject availability with start time before 09:00 or invalid max appointments')`
  - `Bloqueo a rol AUXILIARY para modificar disponibilidad semanal` -> `it('should reject AUXILIARY attempt to configure availability with 403 FORBIDDEN')`
  - `Administradora registra bloqueo por vacaciones y auxiliar lista bloqueos` -> `it('should allow ADMIN to register schedule block and AUXILIARY to list blocks')`
  - `Creación exitosa de cita odontológica dentro de la disponibilidad` -> `it('should create scheduled appointment within availability slot')`
  - `Rechazo con estado 409 cuando la cita se solapa con otra cita activa` -> `it('should reject overlapping appointment with 409 CONFLICT')`
  - `Rechazo con estado 422 cuando se supera el tope máximo diario de citas` -> `it('should reject appointment exceeding daily max limit with 422 UNPROCESSABLE')`
  - `Rechazo con estado 409 cuando la cita colisiona con un bloqueo de agenda` -> `it('should reject appointment colliding with schedule block with 409 CONFLICT')`
  - `Reprogramación exitosa de cita a nuevo horario sin conflicto` -> `it('should reschedule appointment to available time slot successfully')`
  - `Cancelación de cita con motivo obligatorio` -> `it('should cancel appointment when valid cancellation reason is provided')`
  - `Transición exitosa de estado de la cita a confirmada y atendida` -> `it('should transition appointment status through SCHEDULED, CONFIRMED and ATTENDED')`
  - `Rechazo de transición inválida en cita cancelada` -> `it('should reject invalid status transition on cancelled appointment with 400')`
- [x] 4.4 Ejecutar `pnpm --filter backend lint`, `typecheck`, `deps:check` y pruebas E2E en verde, realizando commit `feat(scheduling): expose scheduling REST endpoints and E2E tests`.

## 5. OpenAPI, Evidencia Literal y Cierre de Change

- [x] 5.1 Regenerar `Backend/openapi.json` con `pnpm --filter backend openapi:generate` y verificar esquemas de `/v1/scheduling/...`.
- [x] 5.2 Ejecutar comandos de verificación completos capturando salidas literales en `evidence.md`:
  - `pnpm --filter backend lint`
  - `pnpm --filter backend typecheck`
  - `pnpm --filter backend deps:check`
  - `pnpm --filter backend test:cov` (con cobertura >= 90% en domain/application y >= 80% global)
  - `pnpm --filter backend test:e2e`
- [x] 5.3 Marcar todas las tareas en `tasks.md`, verificar consistencia de artefactos y realizar commit `chore(scheduling): regenerate openapi.json and record B-13 literal evidence`.
