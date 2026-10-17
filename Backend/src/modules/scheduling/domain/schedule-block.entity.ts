import { TimeSlot } from './time-slot.vo';
import { DomainError, DomainErrorCategory } from '../../../shared/domain/domain-error';

export class InvalidScheduleBlockDataError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_SCHEDULE_BLOCK_DATA';

  constructor(message: string) {
    super(message);
  }
}

export interface ScheduleBlockProps {
  id: string;
  clinicId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleBlock {
  readonly id: string;
  readonly clinicId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly reason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: ScheduleBlockProps) {
    this.id = props.id;
    this.clinicId = props.clinicId;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.reason = props.reason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: ScheduleBlockProps): ScheduleBlock {
    ScheduleBlock.validateIdsAndReason(props.id, props.clinicId, props.reason);
    ScheduleBlock.validateDates(props.startDate, props.endDate);

    return new ScheduleBlock({
      ...props,
      clinicId: props.clinicId.trim(),
      reason: props.reason.trim(),
    });
  }

  collidesWith(timeSlot: TimeSlot): boolean {
    return (
      timeSlot.startTime.getTime() < this.endDate.getTime() &&
      timeSlot.endTime.getTime() > this.startDate.getTime()
    );
  }

  private static validateIdsAndReason(id: string, clinicId: string, reason: string): void {
    if (!id || id.trim().length === 0) {
      throw new InvalidScheduleBlockDataError('El identificador del bloqueo es obligatorio');
    }
    if (!clinicId || clinicId.trim().length === 0) {
      throw new InvalidScheduleBlockDataError('El identificador de la clínica es obligatorio');
    }
    if (!reason || reason.trim().length === 0) {
      throw new InvalidScheduleBlockDataError('El motivo del bloqueo es obligatorio');
    }
  }

  private static validateDates(startDate: Date, endDate: Date): void {
    const isStartValid = startDate instanceof Date && !isNaN(startDate.getTime());
    if (!isStartValid) {
      throw new InvalidScheduleBlockDataError('La fecha de inicio del bloqueo es inválida');
    }
    const isEndValid = endDate instanceof Date && !isNaN(endDate.getTime());
    if (!isEndValid) {
      throw new InvalidScheduleBlockDataError('La fecha de fin del bloqueo es inválida');
    }
    if (endDate.getTime() <= startDate.getTime()) {
      throw new InvalidScheduleBlockDataError(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }
  }
}
