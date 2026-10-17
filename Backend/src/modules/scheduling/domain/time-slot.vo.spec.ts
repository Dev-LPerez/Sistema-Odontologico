import { TimeSlot } from './time-slot.vo';
import { InvalidTimeSlotError } from './scheduling.errors';

describe('TimeSlot Value Object', () => {
  it('should create a valid TimeSlot from start time and duration', () => {
    // 2026-10-20 at 14:00 UTC is 09:00 in America/Bogota (UTC-5)
    const startTime = new Date('2026-10-20T14:00:00.000Z');
    const timeSlot = TimeSlot.create(startTime, 60);

    expect(timeSlot.startTime).toEqual(startTime);
    expect(timeSlot.endTime).toEqual(new Date('2026-10-20T15:00:00.000Z'));
    expect(timeSlot.durationMinutes).toBe(60);
  });

  it('should calculate Bogota local time representation correctly (RC-054)', () => {
    // 14:30 UTC is 09:30 America/Bogota
    const startTime = new Date('2026-10-20T14:30:00.000Z');
    const timeSlot = TimeSlot.create(startTime, 45);

    const bogotaTime = timeSlot.getBogotaTime();
    expect(bogotaTime.hour).toBe(9);
    expect(bogotaTime.minute).toBe(30);
    expect(timeSlot.getBogotaDateString()).toBe('2026-10-20');
    // 2026-10-20 is Tuesday -> 2
    expect(timeSlot.getBogotaDayOfWeek()).toBe(2);
  });

  it('should reject invalid duration less than 15 minutes or non-integer', () => {
    const startTime = new Date('2026-10-20T14:00:00.000Z');

    expect(() => TimeSlot.create(startTime, 10)).toThrow(InvalidTimeSlotError);
    expect(() => TimeSlot.create(startTime, 0)).toThrow(InvalidTimeSlotError);
    expect(() => TimeSlot.create(startTime, -30)).toThrow(InvalidTimeSlotError);
    expect(() => TimeSlot.create(startTime, 30.5)).toThrow(InvalidTimeSlotError);
  });

  it('should reject duration exceeding maximum allowed (480 minutes / 8 hours)', () => {
    const startTime = new Date('2026-10-20T14:00:00.000Z');

    expect(() => TimeSlot.create(startTime, 500)).toThrow(InvalidTimeSlotError);
  });

  it('should reject invalid Date instances', () => {
    expect(() => TimeSlot.create(new Date('invalid-date'), 60)).toThrow(InvalidTimeSlotError);
  });

  it('should detect overlapping between two time slots correctly', () => {
    const base = TimeSlot.create(new Date('2026-10-20T15:00:00.000Z'), 60); // 15:00 to 16:00
    const overlapping1 = TimeSlot.create(new Date('2026-10-20T15:30:00.000Z'), 60); // 15:30 to 16:30
    const overlapping2 = TimeSlot.create(new Date('2026-10-20T14:30:00.000Z'), 45); // 14:30 to 15:15
    const contiguousAfter = TimeSlot.create(new Date('2026-10-20T16:00:00.000Z'), 30); // 16:00 to 16:30
    const contiguousBefore = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60); // 14:00 to 15:00
    const separate = TimeSlot.create(new Date('2026-10-20T17:00:00.000Z'), 30); // 17:00 to 17:30

    expect(base.overlapsWith(overlapping1)).toBe(true);
    expect(base.overlapsWith(overlapping2)).toBe(true);
    expect(base.overlapsWith(contiguousAfter)).toBe(false);
    expect(base.overlapsWith(contiguousBefore)).toBe(false);
    expect(base.overlapsWith(separate)).toBe(false);
  });

  it('should verify whether time slot falls within availability bounds', () => {
    // 14:00 UTC is 09:00 Bogota, 60 min -> ends 10:00 Bogota on Tuesday (day 2)
    const slot = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60);

    // Matching day, starts at 09:00 ends at 18:00
    expect(slot.isWithinAvailability(2, '09:00', '18:00')).toBe(true);
    // Non-matching day
    expect(slot.isWithinAvailability(3, '09:00', '18:00')).toBe(false);
    // Starts before availability
    expect(slot.isWithinAvailability(2, '10:00', '18:00')).toBe(false);
    // Ends after availability
    expect(slot.isWithinAvailability(2, '09:00', '09:30')).toBe(false);
  });
});
