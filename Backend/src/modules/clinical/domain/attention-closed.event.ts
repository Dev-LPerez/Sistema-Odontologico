import { DomainEvent } from '../../../shared/domain/domain-event';
import { ProcedurePerformed } from './clinical-attention.entity';

export interface AttentionClosedEventProps {
  aggregateId: string;
  occurredOn: Date;
  clinicId: string;
  patientId: string;
  clinicalHistoryId: string;
  attendedByUserId: string;
  proceduresPerformed: ProcedurePerformed[];
}

export class AttentionClosedEvent implements DomainEvent {
  readonly eventName = 'clinical.attention.closed';
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly clinicId: string;
  readonly patientId: string;
  readonly clinicalHistoryId: string;
  readonly attendedByUserId: string;
  readonly proceduresPerformed: ProcedurePerformed[];

  constructor(props: AttentionClosedEventProps) {
    this.aggregateId = props.aggregateId;
    this.occurredOn = props.occurredOn;
    this.clinicId = props.clinicId;
    this.patientId = props.patientId;
    this.clinicalHistoryId = props.clinicalHistoryId;
    this.attendedByUserId = props.attendedByUserId;
    this.proceduresPerformed = [...props.proceduresPerformed];
  }
}
