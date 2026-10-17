import { DomainEvent } from '../../../shared/domain/domain-event';

export interface AppointmentCancelledEventProps {
  aggregateId: string;
  occurredOn: Date;
  clinicId: string;
  reason: string;
}

export class AppointmentCancelledEvent implements DomainEvent {
  readonly eventName = 'scheduling.appointment.cancelled';
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly clinicId: string;
  readonly reason: string;

  constructor(props: AppointmentCancelledEventProps) {
    this.aggregateId = props.aggregateId;
    this.occurredOn = props.occurredOn;
    this.clinicId = props.clinicId;
    this.reason = props.reason;
  }
}
