import { NestEventBusAdapter } from './nest-event-bus.adapter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../../domain/domain-event';

class DummyEvent implements DomainEvent {
  readonly eventName = 'dummy.event';
  constructor(
    readonly aggregateId: string,
    readonly occurredOn: Date,
  ) {}
}

describe('NestEventBusAdapter', () => {
  let eventBus: NestEventBusAdapter;
  let mockEventEmitter: { emitAsync: jest.Mock };

  beforeEach(() => {
    mockEventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
    };
    eventBus = new NestEventBusAdapter(mockEventEmitter as unknown as EventEmitter2);
  });

  it('debe publicar un evento individual usando emitAsync con el eventName y el evento', async () => {
    const event = new DummyEvent('agg-1', new Date());

    await eventBus.publish(event);

    expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('dummy.event', event);
  });

  it('debe publicar una lista de eventos en orden secuencial', async () => {
    const event1 = new DummyEvent('agg-1', new Date());
    const event2 = new DummyEvent('agg-2', new Date());

    await eventBus.publishAll([event1, event2]);

    expect(mockEventEmitter.emitAsync).toHaveBeenCalledTimes(2);
    expect(mockEventEmitter.emitAsync).toHaveBeenNthCalledWith(1, 'dummy.event', event1);
    expect(mockEventEmitter.emitAsync).toHaveBeenNthCalledWith(2, 'dummy.event', event2);
  });
});
