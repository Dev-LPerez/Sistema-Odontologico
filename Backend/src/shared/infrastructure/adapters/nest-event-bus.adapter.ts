import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBusPort } from '../../application/ports/event-bus.port';
import { DomainEvent } from '../../domain/domain-event';

@Injectable()
export class NestEventBusAdapter implements EventBusPort {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.eventEmitter.emitAsync(event.eventName, event);
  }

  async publishAll(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
