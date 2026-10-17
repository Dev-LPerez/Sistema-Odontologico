# Spec Delta: scheduling-management

## Purpose
Gestionar la disponibilidad semanal de atención, bloqueos puntuales de agenda (vacaciones/días libres) y el ciclo de vida completo de citas odontológicas del consultorio en zona horaria America/Bogota con validaciones estrictas de solapamiento horario y topes máximos por jornada.

## ADDED Requirements

### Requirement: Configuración y consulta de la disponibilidad semanal de atención
El sistema SHALL permitir al rol `ADMIN` configurar las franjas horarias semanales de atención del consultorio (días de la semana, hora inicio >= 09:00 a. m. y hora fin evaluadas en America/Bogota) y el tope máximo de citas por jornada (3 o 4), y permitir a `ADMIN` y `AUXILIARY` consultarlas (RF-B-061, RF-B-065, RNF-B-004, RNF-B-032, RC-005, RC-054).

#### Scenario: Administradora configura disponibilidad semanal válida y auxiliar la consulta
- **GIVEN** una clínica activa con identificador `"clinic-123"`
- **WHEN** `ADMIN` envía `PUT /v1/scheduling/availability` con slots para lunes a viernes de 09:00 a 18:00 y `maxDailyAppointments: 4`, y luego `AUXILIARY` consulta `GET /v1/scheduling/availability`
- **THEN** la configuración responde con HTTP `200` y la consulta de `AUXILIARY` responde con HTTP `200` devolviendo las reglas configuradas

#### Scenario: Rechazo por hora de inicio anterior a las 09:00 a. m. o tope fuera de rango
- **GIVEN** un usuario autenticado con rol `ADMIN`
- **WHEN** envía `PUT /v1/scheduling/availability` con inicio a las `"08:00"` o `maxDailyAppointments: 10`
- **THEN** la API rechaza la solicitud con estado HTTP `400` (`INVALID_AVAILABILITY_CONFIGURATION`)

#### Scenario: Bloqueo a rol AUXILIARY para modificar disponibilidad semanal
- **GIVEN** un usuario autenticado con rol `AUXILIARY`
- **WHEN** envía `PUT /v1/scheduling/availability` con nuevas reglas de horario
- **THEN** la API rechaza la petición con estado HTTP `403` (`FORBIDDEN_ROLE`)

### Requirement: Registro y consulta de bloqueos temporales de agenda
El sistema SHALL permitir al rol `ADMIN` registrar bloqueos temporales de agenda por vacaciones o días libres indicando fecha/hora de inicio, fecha/hora de fin y motivo, y permitir a `ADMIN` y `AUXILIARY` listar los bloqueos activos del consultorio (RF-B-061, RF-B-065, RNF-B-004, RC-005, RC-054).

#### Scenario: Administradora registra bloqueo por vacaciones y auxiliar lista bloqueos
- **GIVEN** una clínica activa en `"clinic-123"`
- **WHEN** `ADMIN` envía `POST /v1/scheduling/blocks` con rango del 20 al 25 de diciembre y motivo `"Vacaciones de fin de año"`, y luego `AUXILIARY` consulta `GET /v1/scheduling/blocks`
- **THEN** la creación responde con HTTP `201` y el listado responde con HTTP `200` incluyendo el bloqueo registrado

### Requirement: Creación y consulta de citas con validación de no solapamiento y cupo diario
El sistema SHALL permitir a `ADMIN` y `AUXILIARY` crear citas para pacientes activos indicando fecha/hora UTC, duración en minutos y procedimiento, validando que no se solape con otra cita activa, que caiga dentro de la disponibilidad semanal, que no exceda el tope de citas diarias y que no colisione con bloqueos (RF-B-060, RF-B-061, RNF-B-045, RC-005, RC-054).

#### Scenario: Creación exitosa de cita odontológica dentro de la disponibilidad
- **GIVEN** un paciente activo y disponibilidad configurada para el día seleccionado
- **WHEN** `AUXILIARY` envía `POST /v1/scheduling/appointments` con `patientId`, `procedureId`, fecha/hora a las 10:00 a. m. y duración de 60 minutos
- **THEN** la API responde con estado HTTP `201` devolviendo la cita con estado `"SCHEDULED"`

#### Scenario: Rechazo con estado 409 cuando la cita se solapa con otra cita activa
- **GIVEN** una cita activa previamente agendada de 10:00 a 11:00 a. m.
- **WHEN** `AUXILIARY` envía `POST /v1/scheduling/appointments` para el mismo consultorio de 10:30 a 11:30 a. m.
- **THEN** la API rechaza la solicitud con estado HTTP `409` (`APPOINTMENT_OVERLAP_CONFLICT`)

#### Scenario: Rechazo con estado 422 cuando se supera el tope máximo diario de citas
- **GIVEN** una jornada donde ya existen 4 citas activas y el tope máximo configurado es 4
- **WHEN** `ADMIN` envía `POST /v1/scheduling/appointments` intentando agendar una quinta cita en esa misma fecha
- **THEN** la API rechaza la operación con estado HTTP `422` (`DAILY_APPOINTMENTS_LIMIT_EXCEEDED`)

#### Scenario: Rechazo con estado 409 cuando la cita colisiona con un bloqueo de agenda
- **GIVEN** un bloqueo de agenda registrado para el consultorio durante todo el día viernes
- **WHEN** `AUXILIARY` envía `POST /v1/scheduling/appointments` para ese viernes
- **THEN** la API rechaza la solicitud con estado HTTP `409` (`SCHEDULE_BLOCK_CONFLICT`)

### Requirement: Reprogramación y cancelación de citas odontológicas
El sistema SHALL permitir a `ADMIN` y `AUXILIARY` reprogramar citas en estados no terminales hacia un nuevo horario validando solapamiento, disponibilidad y topes diarios, y cancelar citas registrando el motivo obligatorio de cancelación (RF-B-060, RF-B-063, RC-005, RC-054).

#### Scenario: Reprogramación exitosa de cita a nuevo horario sin conflicto
- **GIVEN** una cita en estado `"SCHEDULED"`
- **WHEN** `AUXILIARY` envía `PATCH /v1/scheduling/appointments/:id/reschedule` con nueva fecha y hora disponible
- **THEN** la API responde con estado HTTP `200` actualizando la fecha/hora de la cita y conservando su trazabilidad

#### Scenario: Cancelación de cita con motivo obligatorio
- **GIVEN** una cita existente en estado `"SCHEDULED"` o `"CONFIRMED"`
- **WHEN** `ADMIN` envía `PATCH /v1/scheduling/appointments/:id/cancel` con `cancellationReason: "Paciente solicitó cancelar por viaje"`
- **THEN** la API responde con HTTP `200` y la cita pasa a estado `"CANCELLED"`

### Requirement: Gestión del ciclo de vida y transición de estados de la cita
El sistema SHALL gestionar las transiciones de estado de la cita (`SCHEDULED` -> `CONFIRMED` -> `ATTENDED` o `NO_SHOW`, o `CANCELLED` desde cualquier estado previo a atención), impidiendo transiciones inválidas o modificaciones una vez finalizada la cita (RF-B-063, RNF-B-004, RC-005).

#### Scenario: Transición exitosa de estado de la cita a confirmada y atendida
- **GIVEN** una cita en estado `"SCHEDULED"`
- **WHEN** `AUXILIARY` envía `PATCH /v1/scheduling/appointments/:id/status` con `status: "CONFIRMED"` y posteriormente `PATCH /v1/scheduling/appointments/:id/status` con `status: "ATTENDED"`
- **THEN** cada transición responde con HTTP `200` reflejando el nuevo estado

#### Scenario: Rechazo de transición inválida en cita cancelada
- **GIVEN** una cita con estado `"CANCELLED"`
- **WHEN** `AUXILIARY` envía `PATCH /v1/scheduling/appointments/:id/status` intentando pasarla a `"ATTENDED"`
- **THEN** la API rechaza la transición con estado HTTP `400` (`INVALID_APPOINTMENT_STATUS_TRANSITION`)
