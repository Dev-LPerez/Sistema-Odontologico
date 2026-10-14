import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

class TestCreatedEvent implements DomainEvent {
  readonly eventName = 'test.created';
  constructor(
    readonly aggregateId: string,
    readonly occurredOn: Date,
  ) {}
}

class TestUpdatedEvent implements DomainEvent {
  readonly eventName = 'test.updated';
  constructor(
    readonly aggregateId: string,
    readonly occurredOn: Date,
  ) {}
}

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string) {
    super(id);
  }

  doSomething(now: Date): void {
    this.addDomainEvent(new TestCreatedEvent(this.id, now));
  }

  doAnotherThing(now: Date): void {
    this.addDomainEvent(new TestUpdatedEvent(this.id, now));
  }
}

describe('AggregateRoot', () => {
  it('debe inicializarse con un identificador y lista vacía de eventos', () => {
    const aggregate = new TestAggregate('agg-123');

    expect(aggregate.id).toBe('agg-123');
    expect(aggregate.domainEvents).toEqual([]);
  });

  it('debe acumular eventos de dominio en orden', () => {
    const aggregate = new TestAggregate('agg-123');
    const now1 = new Date('2026-10-13T10:00:00.000Z');
    const now2 = new Date('2026-10-13T10:05:00.000Z');

    aggregate.doSomething(now1);
    aggregate.doAnotherThing(now2);

    expect(aggregate.domainEvents).toHaveLength(2);
    expect(aggregate.domainEvents[0].eventName).toBe('test.created');
    expect(aggregate.domainEvents[0].aggregateId).toBe('agg-123');
    expect(aggregate.domainEvents[0].occurredOn).toEqual(now1);

    expect(aggregate.domainEvents[1].eventName).toBe('test.updated');
    expect(aggregate.domainEvents[1].aggregateId).toBe('agg-123');
    expect(aggregate.domainEvents[1].occurredOn).toEqual(now2);
  });

  it('debe limpiar los eventos de dominio acumulados cuando se invoque clearDomainEvents', () => {
    const aggregate = new TestAggregate('agg-123');
    aggregate.doSomething(new Date());

    expect(aggregate.domainEvents).toHaveLength(1);

    aggregate.clearDomainEvents();

    expect(aggregate.domainEvents).toEqual([]);
  });

  it('debe retornar una copia inmutable o protegida de la lista de eventos', () => {
    const aggregate = new TestAggregate('agg-123');
    aggregate.doSomething(new Date());

    const events = aggregate.domainEvents as DomainEvent[];
    events.pop();

    expect(aggregate.domainEvents).toHaveLength(1);
  });
});
