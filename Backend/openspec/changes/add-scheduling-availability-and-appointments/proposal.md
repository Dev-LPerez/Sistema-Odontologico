# Proposal: add-scheduling-availability-and-appointments

## Why
El consultorio de la Dra. Pacheco requiere organizar su operación clínica diaria definiendo con precisión sus reglas de disponibilidad semanal y bloqueos de agenda (vacaciones/días libres), así como gestionar citas odontológicas con validación estricta de no solapamiento y cupo máximo diario (máx. 3 o 4 citas configurables). Esta capacidad previene la sobrecarga operativa, garantiza la atención puntual y sienta las bases de dominio para la posterior sincronización con Google Calendar.

## What Changes
- Creación del nuevo módulo `modules/scheduling` estructurado bajo Clean Architecture de cuatro capas (`domain`, `application`, `infrastructure`, `presentation`).
- Modelo de disponibilidad semanal del consultorio (`WeeklyAvailability`) y bloqueos puntuales (`ScheduleBlock` por vacaciones o días libres) con validación horaria en zona `America/Bogota` (RC-054).
- Agregado raíz `Appointment` con objeto de valor `TimeSlot` inmutable, validación contra citas solapadas y control de tope máximo de citas por jornada (RF-B-060, RF-B-061, RNF-B-045).
- Máquina de estados estricta para citas: `SCHEDULED`, `CONFIRMED`, `ATTENDED`, `NO_SHOW`, `CANCELLED` (RF-B-063).
- Endpoints REST bajo `/v1/scheduling/` para gestión de disponibilidad, bloqueos y ciclo de vida de citas, con autorización por rol (`ADMIN` y `AUXILIARY`) y aislamiento multitenant por `clinicId` (RF-B-065, RNF-B-004, RNF-B-032, RC-005).
- Modelos en Prisma (`AvailabilitySlot`, `ScheduleBlock`, `Appointment`) con `onDelete: Restrict` hacia `Clinic`, `Patient` y `Procedure` (RC-055).

## Capabilities

### New Capabilities
- `scheduling-management`: Gestión de disponibilidad semanal, bloqueos de agenda y ciclo de vida de citas odontológicas con validación de solapamiento y límites diarios.

### Modified Capabilities
*(Ninguna)*

## Impact
- **Módulos afectados:** Creación de `Backend/src/modules/scheduling/` y registro en `AppModule`.
- **Base de datos:** Nuevas tablas en Prisma para disponibilidad, bloqueos y citas con claves foráneas `onDelete: Restrict`.
- **API:** Nuevos endpoints en `/v1/scheduling/...` expuestos en `Backend/openapi.json`.
- **Change equivalente en Frontend:** `add-scheduling-availability-and-appointments`.
- **Requisitos cubiertos:** RF-B-060, RF-B-061, RF-B-063, RF-B-065, RNF-B-004, RNF-B-032, RNF-B-045, RC-002, RC-005, RC-015, RC-018, RC-054.
