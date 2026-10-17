import { DomainEvent } from '../../../shared/domain/domain-event';
import { AppointmentStatus } from './appointment-status.enum';

export interface AppointmentStatusChangedEventProps {
  aggregateId: string;
  occurredOn: Date;
  clinicId: string;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
}

export class AppointmentStatusChangedEvent implements DomainEvent {
  readonly eventName = 'scheduling.appointment.status_changed';
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly clinicId: string;
  readonly fromStatus: AppointmentStatus;
  readonly toStatus: AppointmentStatus;

  constructor(props: AppointmentStatusChangedEventProps) {
    this.aggregateId = props.aggregateId;
    this.occurredOn = props.occurredOn;
    this.clinicId = props.clinicId;
    this.fromStatus = props.fromStatus;
    this.toStatus = props.toStatus;
  }
}
