# Design: add-scheduling-availability-and-appointments

## Context
Ver motivación y problema en `proposal.md`. El módulo `modules/scheduling` introduce la gestión de agenda del consultorio. Requiere cumplir con Clean Architecture de cuatro capas (`domain`, `application`, `infrastructure`, `presentation`), inyección de dependencias estricta sin instanciación con `new` en casos de uso, evaluación temporal en `America/Bogota` a partir de marcas de tiempo UTC (`RC-054`), claves foráneas con `onDelete: Restrict` (`RC-055`), pruebas de contrato contra PostgreSQL real (`RC-018`, `RC-050`) y captura de errores `P2002` convertidos a excepciones de dominio `409 Conflict`.

## Goals / Non-Goals

**Goals:**
- Configuración persistente de disponibilidad semanal del consultorio (hora inicio >= 09:00 a. m., hora fin, días laborables y tope diario de 3 o 4 citas).
- Registro y consulta de bloqueos puntuales de agenda (vacaciones, ausencias o días libres).
- Agregado `Appointment` con máquina de estados estricta (`SCHEDULED`, `CONFIRMED`, `ATTENDED`, `NO_SHOW`, `CANCELLED`).
- Objeto de valor inmutable `TimeSlot` para validación de intervalos temporales, duración y no solapamiento.
- Reglas de dominio para validar que una cita no colisione con otra cita activa, no caiga en bloqueo, respete las franjas de disponibilidad y no supere el tope diario permitido.
- Emisión de eventos de dominio (`AppointmentScheduledEvent`, `AppointmentRescheduledEvent`, `AppointmentCancelledEvent`, `AppointmentStatusChangedEvent`).
- Controladores REST bajo `/v1/scheduling/` con validación DTO y autorización por rol (`ADMIN` y `AUXILIARY`).

**Non-Goals:**
- Sincronización con Google Calendar u OAuth2 (corresponde a B-14 `add-scheduling-google-calendar-sync`).
- Enlace público de agendamiento para pacientes (excluido del MVP según `RF-B-066`).
- Notificaciones automáticas por WhatsApp o correo (excluido del MVP según `RF-B-077`).

## Decisions

### 1. Módulo y Capas Afectadas
- **Módulo nuevo:** `Backend/src/modules/scheduling/`.
- **Capa `domain`:**
  - Agregado raíz `Appointment` y entidades `WeeklyAvailability`, `ScheduleBlock`.
  - Objeto de valor inmutable `TimeSlot` (`startTime`, `endTime`, `durationMinutes`).
  - Enumeraciones: `AppointmentStatus` (`SCHEDULED`, `CONFIRMED`, `ATTENDED`, `NO_SHOW`, `CANCELLED`), `DayOfWeek`.
  - Errores de dominio tipados: `AppointmentOverlapConflictException`, `DailyAppointmentsLimitExceededException`, `ScheduleBlockConflictException`, `InvalidAppointmentStatusTransitionException`, `InvalidAvailabilityConfigurationException`, `AppointmentNotFoundException`.
  - Puertos de repositorio y consultas: `AppointmentRepositoryPort`, `AppointmentQueriesPort`, `AvailabilityRepositoryPort`, `ScheduleBlockRepositoryPort`.
  - Eventos de dominio: `AppointmentScheduledEvent`, `AppointmentRescheduledEvent`, `AppointmentCancelledEvent`, `AppointmentStatusChangedEvent`.
- **Capa `application`:**
  - Casos de uso: `ConfigureAvailabilityUseCase`, `GetAvailabilityQuery`, `CreateScheduleBlockUseCase`, `ListScheduleBlocksQuery`, `ScheduleAppointmentUseCase`, `RescheduleAppointmentUseCase`, `CancelAppointmentUseCase`, `ChangeAppointmentStatusUseCase`, `GetAppointmentByIdQuery`, `ListAppointmentsQuery`.
  - Dependencias de puertos `ClockPort` e `IdGeneratorPort` inyectados vía constructor.
- **Capa `infrastructure`:**
  - Modelos Prisma con `onDelete: Restrict`: `AvailabilityConfig`, `ScheduleBlock`, `Appointment`.
  - Adaptadores Prisma e InMemory para repositorios y consultas con suites de contrato (`*.contract.spec.ts`) contra PostgreSQL real.
  - Limpieza de tablas con `cleanDatabaseForContractTests(prisma)`.
- **Capa `presentation`:**
  - `SchedulingController` con decoradores de rol (`@Roles('ADMIN')`, `@Roles('ADMIN', 'AUXILIARY')`), `@CurrentClinic()` y `@CurrentUser()`.
  - DTOs tipados con `class-validator` y `class-transformer`.

### 2. Esquema de Prisma y Relaciones
```prisma
model AvailabilityConfig {
  id                    String   @id
  clinicId              String   @unique
  maxDailyAppointments  Int      @default(4)
  slotsJson             Json     // [{ dayOfWeek: 1..7, startTime: "09:00", endTime: "18:00" }]
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  clinic                Clinic   @relation(fields: [clinicId], references: [id], onDelete: Restrict)

  @@index([clinicId])
}

model ScheduleBlock {
  id        String   @id
  clinicId  String
  startDate DateTime
  endDate   DateTime
  reason    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  clinic    Clinic   @relation(fields: [clinicId], references: [id], onDelete: Restrict)

  @@index([clinicId, startDate, endDate])
}

model Appointment {
  id                 String   @id
  clinicId           String
  patientId          String
  procedureId        String
  startTime          DateTime
  endTime            DateTime
  durationMinutes    Int
  status             String   // SCHEDULED, CONFIRMED, ATTENDED, NO_SHOW, CANCELLED
  cancellationReason String?
  notes              String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  clinic    Clinic    @relation(fields: [clinicId], references: [id], onDelete: Restrict)
  patient   Patient   @relation(fields: [patientId], references: [id], onDelete: Restrict)
  procedure Procedure @relation(fields: [procedureId], references: [id], onDelete: Restrict)

  @@index([clinicId, startTime, endTime])
  @@index([clinicId, patientId])
}
```

### 3. Validación Temporal y Zonas Horarias (RC-054)
- Todas las fechas se persisten en UTC en PostgreSQL (`DateTime`).
- La validación de franjas horarias (por ejemplo, hora de inicio no antes de las 09:00 a. m. y pertenencia al día de la semana) se evalúa traduciendo la marca de tiempo UTC a la zona horaria `America/Bogota` mediante utilidades del dominio apoyadas en `ClockPort`.
- Dos citas de un mismo `clinicId` se solapan si `cita1.startTime < cita2.endTime && cita1.endTime > cita2.startTime`, excluyendo citas en estado `CANCELLED`.

### 4. Decisión sobre ADR
- No se requiere un ADR nuevo; se respetan las decisiones establecidas en `ADR-0001` (Clean Architecture, monolito modular, repositorios segregados y puertos en kernel compartido).

## Risks / Trade-offs

- **[Riesgo: Condiciones de carrera al agendar citas concurrentes]** → **Mitigación:** Validación de solapamiento en consulta transaccional dentro del caso de uso y captura de colisiones.
- **[Riesgo: Complejidad en evaluación de hora local vs UTC]** → **Mitigación:** Métodos auxiliares puros dentro del objeto de valor `TimeSlot` con pruebas unitarias exhaustivas con horas límite (medianoche UTC, cambios de día local).
- **[Riesgo: Rendimiento de validación de tope diario]** → **Mitigación:** Índice compuesto en Prisma `[clinicId, startTime, endTime]` que permite conteos rápidos en rango de fecha para el día evaluado.
