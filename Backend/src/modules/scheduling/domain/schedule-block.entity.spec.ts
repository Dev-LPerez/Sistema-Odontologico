import { ScheduleBlock, InvalidScheduleBlockDataError } from './schedule-block.entity';
import { TimeSlot } from './time-slot.vo';

describe('ScheduleBlock Entity', () => {
  it('should create a valid ScheduleBlock', () => {
    const startDate = new Date('2026-12-20T00:00:00.000Z');
    const endDate = new Date('2026-12-25T23:59:59.000Z');

    const block = ScheduleBlock.create({
      id: 'block-1',
      clinicId: 'clinic-123',
      startDate,
      endDate,
      reason: 'Vacaciones de fin de año',
      createdAt: new Date('2026-10-16T12:00:00.000Z'),
      updatedAt: new Date('2026-10-16T12:00:00.000Z'),
    });

    expect(block.id).toBe('block-1');
    expect(block.clinicId).toBe('clinic-123');
    expect(block.reason).toBe('Vacaciones de fin de año');
  });

  it('should reject empty reason or invalid date range', () => {
    const startDate = new Date('2026-12-25T00:00:00.000Z');
    const endDate = new Date('2026-12-20T00:00:00.000Z');

    expect(() =>
      ScheduleBlock.create({
        id: 'block-1',
        clinicId: 'clinic-123',
        startDate,
        endDate,
        reason: 'Vacaciones',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidScheduleBlockDataError);

    expect(() =>
      ScheduleBlock.create({
        id: 'block-1',
        clinicId: 'clinic-123',
        startDate: new Date('2026-12-20T00:00:00.000Z'),
        endDate: new Date('2026-12-25T00:00:00.000Z'),
        reason: '  ',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidScheduleBlockDataError);

    expect(() =>
      ScheduleBlock.create({
        id: '  ',
        clinicId: 'clinic-123',
        startDate: new Date('2026-12-20T00:00:00.000Z'),
        endDate: new Date('2026-12-25T00:00:00.000Z'),
        reason: 'Motivo',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidScheduleBlockDataError);

    expect(() =>
      ScheduleBlock.create({
        id: 'block-1',
        clinicId: '  ',
        startDate: new Date('2026-12-20T00:00:00.000Z'),
        endDate: new Date('2026-12-25T00:00:00.000Z'),
        reason: 'Motivo',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidScheduleBlockDataError);

    expect(() =>
      ScheduleBlock.create({
        id: 'block-1',
        clinicId: 'clinic-123',
        startDate: new Date('invalid'),
        endDate: new Date('2026-12-25T00:00:00.000Z'),
        reason: 'Motivo',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidScheduleBlockDataError);

    expect(() =>
      ScheduleBlock.create({
        id: 'block-1',
        clinicId: 'clinic-123',
        startDate: new Date('2026-12-20T00:00:00.000Z'),
        endDate: new Date('invalid'),
        reason: 'Motivo',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidScheduleBlockDataError);
  });

  it('should detect collision with a TimeSlot', () => {
    const block = ScheduleBlock.create({
      id: 'block-1',
      clinicId: 'clinic-123',
      startDate: new Date('2026-12-20T00:00:00.000Z'),
      endDate: new Date('2026-12-25T23:59:59.000Z'),
      reason: 'Vacaciones',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const collidingSlot = TimeSlot.create(new Date('2026-12-22T15:00:00.000Z'), 60);
    const nonCollidingSlot = TimeSlot.create(new Date('2026-12-28T15:00:00.000Z'), 60);

    expect(block.collidesWith(collidingSlot)).toBe(true);
    expect(block.collidesWith(nonCollidingSlot)).toBe(false);
  });
});
