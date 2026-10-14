import { DomainEvent } from '../../domain/domain-event';

export const EVENT_BUS_PORT = Symbol('EVENT_BUS_PORT');

export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: ReadonlyArray<DomainEvent>): Promise<void>;
}
