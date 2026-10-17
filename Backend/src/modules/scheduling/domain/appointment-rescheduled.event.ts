import { DomainEvent } from '../../../shared/domain/domain-event';

export interface AppointmentRescheduledEventProps {
  aggregateId: string;
  occurredOn: Date;
  clinicId: string;
  oldStartTime: Date;
  newStartTime: Date;
  newEndTime: Date;
}

export class AppointmentRescheduledEvent implements DomainEvent {
  readonly eventName = 'scheduling.appointment.rescheduled';
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly clinicId: string;
  readonly oldStartTime: Date;
  readonly newStartTime: Date;
  readonly newEndTime: Date;

  constructor(props: AppointmentRescheduledEventProps) {
    this.aggregateId = props.aggregateId;
    this.occurredOn = props.occurredOn;
    this.clinicId = props.clinicId;
    this.oldStartTime = props.oldStartTime;
    this.newStartTime = props.newStartTime;
    this.newEndTime = props.newEndTime;
  }
}
