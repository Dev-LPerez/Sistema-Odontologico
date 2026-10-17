import { DomainError, DomainErrorCategory } from '../../../shared/domain/domain-error';

export class InvalidTimeSlotError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_TIME_SLOT';

  constructor(message: string) {
    super(message);
  }
}

export class InvalidAvailabilityConfigurationException extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_AVAILABILITY_CONFIGURATION';

  constructor(message: string) {
    super(message);
  }
}

export class InvalidAppointmentStatusTransitionException extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_APPOINTMENT_STATUS_TRANSITION';

  constructor(from: string, to: string) {
    super(`No está permitida la transición de estado de cita desde '${from}' hacia '${to}'`);
  }
}

export class AppointmentOverlapConflictException extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'APPOINTMENT_OVERLAP_CONFLICT';

  constructor(
    message = 'El horario seleccionado se solapa con otra cita existente en el consultorio',
  ) {
    super(message);
  }
}

export class ScheduleBlockConflictException extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'SCHEDULE_BLOCK_CONFLICT';

  constructor(reason: string) {
    super(`El horario seleccionado colisiona con un bloqueo de agenda activo: ${reason}`);
  }
}

export class DailyAppointmentsLimitExceededException extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'DAILY_APPOINTMENTS_LIMIT_EXCEEDED';

  constructor(limit: number) {
    super(`Se ha alcanzado el tope máximo de ${limit} citas para la jornada seleccionada`);
  }
}

export class AppointmentNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'APPOINTMENT_NOT_FOUND';

  constructor(id: string) {
    super(`Cita con identificador '${id}' no encontrada`);
  }
}

export class ScheduleBlockNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'SCHEDULE_BLOCK_NOT_FOUND';

  constructor(id: string) {
    super(`Bloqueo de agenda con identificador '${id}' no encontrado`);
  }
}
