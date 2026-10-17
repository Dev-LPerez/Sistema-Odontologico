import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { AppointmentStatus } from './appointment-status.enum';
import { TimeSlot } from './time-slot.vo';
import {
  InvalidAppointmentStatusTransitionException,
  InvalidTimeSlotError,
} from './scheduling.errors';
import { AppointmentScheduledEvent } from './appointment-scheduled.event';
import { AppointmentRescheduledEvent } from './appointment-rescheduled.event';
import { AppointmentCancelledEvent } from './appointment-cancelled.event';
import { AppointmentStatusChangedEvent } from './appointment-status-changed.event';

export interface CreateAppointmentProps {
  id: string;
  clinicId: string;
  patientId: string;
  procedureId: string;
  timeSlot: TimeSlot;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteAppointmentProps {
  id: string;
  clinicId: string;
  patientId: string;
  procedureId: string;
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  cancellationReason?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Appointment extends AggregateRoot<string> {
  readonly clinicId: string;
  readonly patientId: string;
  readonly procedureId: string;
  private _timeSlot: TimeSlot;
  private _status: AppointmentStatus;
  private _cancellationReason: string | null;
  private _notes: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    clinicId: string,
    patientId: string,
    procedureId: string,
    timeSlot: TimeSlot,
    status: AppointmentStatus,
    cancellationReason: string | null,
    notes: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this.clinicId = clinicId;
    this.patientId = patientId;
    this.procedureId = procedureId;
    this._timeSlot = timeSlot;
    this._status = status;
    this._cancellationReason = cancellationReason;
    this._notes = notes;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(props: CreateAppointmentProps): Appointment {
    Appointment.validateProps(props);

    const now = new Date();
    const createdAt = props.createdAt ?? now;
    const updatedAt = props.updatedAt ?? now;

    const appointment = new Appointment(
      props.id.trim(),
      props.clinicId.trim(),
      props.patientId.trim(),
      props.procedureId.trim(),
      props.timeSlot,
      AppointmentStatus.SCHEDULED,
      null,
      props.notes?.trim() || null,
      createdAt,
      updatedAt,
    );

    appointment.addDomainEvent(
      new AppointmentScheduledEvent({
        aggregateId: appointment.id,
        occurredOn: createdAt,
        clinicId: appointment.clinicId,
        patientId: appointment.patientId,
        procedureId: appointment.procedureId,
        startTime: appointment.timeSlot.startTime,
        endTime: appointment.timeSlot.endTime,
      }),
    );

    return appointment;
  }

  static reconstitute(props: ReconstituteAppointmentProps): Appointment {
    return new Appointment(
      props.id,
      props.clinicId,
      props.patientId,
      props.procedureId,
      props.timeSlot,
      props.status,
      props.cancellationReason || null,
      props.notes || null,
      props.createdAt,
      props.updatedAt,
    );
  }

  get timeSlot(): TimeSlot {
    return this._timeSlot;
  }

  get status(): AppointmentStatus {
    return this._status;
  }

  get cancellationReason(): string | null {
    return this._cancellationReason;
  }

  get notes(): string | null {
    return this._notes;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  changeStatus(newStatus: AppointmentStatus, updatedAt: Date): void {
    if (this.isTerminal()) {
      throw new InvalidAppointmentStatusTransitionException(this._status, newStatus);
    }

    if (newStatus === this._status) {
      return;
    }

    if (newStatus === AppointmentStatus.CANCELLED) {
      throw new InvalidAppointmentStatusTransitionException(
        this._status,
        'CANCELLED (utilice el método cancel con motivo obligatorio)',
      );
    }

    const fromStatus = this._status;
    this._status = newStatus;
    this._updatedAt = updatedAt;

    this.addDomainEvent(
      new AppointmentStatusChangedEvent({
        aggregateId: this.id,
        occurredOn: updatedAt,
        clinicId: this.clinicId,
        fromStatus,
        toStatus: newStatus,
      }),
    );
  }

  cancel(reason: string, updatedAt: Date): void {
    if (this.isTerminal()) {
      throw new InvalidAppointmentStatusTransitionException(
        this._status,
        AppointmentStatus.CANCELLED,
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new InvalidTimeSlotError('El motivo de cancelación es obligatorio');
    }

    const fromStatus = this._status;
    this._status = AppointmentStatus.CANCELLED;
    this._cancellationReason = reason.trim();
    this._updatedAt = updatedAt;

    this.addDomainEvent(
      new AppointmentCancelledEvent({
        aggregateId: this.id,
        occurredOn: updatedAt,
        clinicId: this.clinicId,
        reason: this._cancellationReason,
      }),
    );

    this.addDomainEvent(
      new AppointmentStatusChangedEvent({
        aggregateId: this.id,
        occurredOn: updatedAt,
        clinicId: this.clinicId,
        fromStatus,
        toStatus: AppointmentStatus.CANCELLED,
      }),
    );
  }

  reschedule(newTimeSlot: TimeSlot, updatedAt: Date): void {
    if (this.isTerminal()) {
      throw new InvalidAppointmentStatusTransitionException(this._status, 'RESCHEDULED');
    }

    if (!newTimeSlot) {
      throw new InvalidTimeSlotError('El nuevo horario de la cita es obligatorio');
    }

    const oldStartTime = this._timeSlot.startTime;
    this._timeSlot = newTimeSlot;
    this._updatedAt = updatedAt;

    this.addDomainEvent(
      new AppointmentRescheduledEvent({
        aggregateId: this.id,
        occurredOn: updatedAt,
        clinicId: this.clinicId,
        oldStartTime,
        newStartTime: newTimeSlot.startTime,
        newEndTime: newTimeSlot.endTime,
      }),
    );
  }

  isTerminal(): boolean {
    return (
      this._status === AppointmentStatus.CANCELLED ||
      this._status === AppointmentStatus.ATTENDED ||
      this._status === AppointmentStatus.NO_SHOW
    );
  }

  private static validateProps(props: CreateAppointmentProps): void {
    if (!props.id || props.id.trim().length === 0) {
      throw new InvalidTimeSlotError('El identificador de la cita es obligatorio');
    }
    if (!props.clinicId || props.clinicId.trim().length === 0) {
      throw new InvalidTimeSlotError('El identificador de la clínica es obligatorio');
    }
    if (!props.patientId || props.patientId.trim().length === 0) {
      throw new InvalidTimeSlotError('El identificador del paciente es obligatorio');
    }
    if (!props.procedureId || props.procedureId.trim().length === 0) {
      throw new InvalidTimeSlotError('El identificador del procedimiento es obligatorio');
    }
    if (!props.timeSlot) {
      throw new InvalidTimeSlotError('La franja horaria de la cita es obligatoria');
    }
  }
}
