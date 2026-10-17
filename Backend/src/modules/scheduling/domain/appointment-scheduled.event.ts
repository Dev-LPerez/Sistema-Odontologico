import { DomainEvent } from '../../../shared/domain/domain-event';

export interface AppointmentScheduledEventProps {
  aggregateId: string;
  occurredOn: Date;
  clinicId: string;
  patientId: string;
  procedureId: string;
  startTime: Date;
  endTime: Date;
}

export class AppointmentScheduledEvent implements DomainEvent {
  readonly eventName = 'scheduling.appointment.scheduled';
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly clinicId: string;
  readonly patientId: string;
  readonly procedureId: string;
  readonly startTime: Date;
  readonly endTime: Date;

  constructor(props: AppointmentScheduledEventProps) {
    this.aggregateId = props.aggregateId;
    this.occurredOn = props.occurredOn;
    this.clinicId = props.clinicId;
    this.patientId = props.patientId;
    this.procedureId = props.procedureId;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
  }
}
