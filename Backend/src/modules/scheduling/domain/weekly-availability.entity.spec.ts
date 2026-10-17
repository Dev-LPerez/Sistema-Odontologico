import { WeeklyAvailability, AvailabilitySlotItem } from './weekly-availability.entity';
import { InvalidAvailabilityConfigurationException } from './scheduling.errors';
import { TimeSlot } from './time-slot.vo';

describe('WeeklyAvailability Entity', () => {
  const validSlots: AvailabilitySlotItem[] = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
  ];

  it('should create a valid WeeklyAvailability with default max appointments', () => {
    const availability = WeeklyAvailability.create({
      clinicId: 'clinic-123',
      slots: validSlots,
      maxDailyAppointments: 4,
    });

    expect(availability.clinicId).toBe('clinic-123');
    expect(availability.maxDailyAppointments).toBe(4);
    expect(availability.slots.length).toBe(5);
  });

  it('should reject start time before 09:00 a. m. (RF-B-061)', () => {
    const invalidSlots: AvailabilitySlotItem[] = [
      { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' },
    ];

    expect(() =>
      WeeklyAvailability.create({
        clinicId: 'clinic-123',
        slots: invalidSlots,
        maxDailyAppointments: 4,
      }),
    ).toThrow(InvalidAvailabilityConfigurationException);
  });

  it('should reject invalid maxDailyAppointments outside allowed range', () => {
    expect(() =>
      WeeklyAvailability.create({
        clinicId: 'clinic-123',
        slots: validSlots,
        maxDailyAppointments: 0,
      }),
    ).toThrow(InvalidAvailabilityConfigurationException);

    expect(() =>
      WeeklyAvailability.create({
        clinicId: 'clinic-123',
        slots: validSlots,
        maxDailyAppointments: 11,
      }),
    ).toThrow(InvalidAvailabilityConfigurationException);
  });

  it('should reject endTime earlier than or equal to startTime', () => {
    const invalidSlots: AvailabilitySlotItem[] = [
      { dayOfWeek: 1, startTime: '14:00', endTime: '12:00' },
    ];

    expect(() =>
      WeeklyAvailability.create({
        clinicId: 'clinic-123',
        slots: invalidSlots,
        maxDailyAppointments: 4,
      }),
    ).toThrow(InvalidAvailabilityConfigurationException);
  });

  it('should reject missing clinicId', () => {
    expect(() =>
      WeeklyAvailability.create({
        clinicId: '',
        slots: validSlots,
        maxDailyAppointments: 4,
      }),
    ).toThrow(InvalidAvailabilityConfigurationException);
  });

  it('should correctly check if a TimeSlot falls within availability', () => {
    const availability = WeeklyAvailability.create({
      clinicId: 'clinic-123',
      slots: [
        { dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 2, startTime: '14:00', endTime: '18:00' },
      ],
      maxDailyAppointments: 4,
    });

    // 2026-10-20 is Tuesday (day 2)
    // 14:00 UTC is 09:00 Bogota, 60 min -> 09:00 to 10:00 Bogota (OK)
    const slotInside = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60);
    expect(availability.isAvailableFor(slotInside)).toBe(true);

    // 18:30 UTC is 13:30 Bogota, 60 min -> 13:30 to 14:30 (Lunch break, NOT OK)
    const slotLunch = TimeSlot.create(new Date('2026-10-20T18:30:00.000Z'), 60);
    expect(availability.isAvailableFor(slotLunch)).toBe(false);

    // 2026-10-21 is Wednesday (day 3), no slots configured -> NOT OK
    const slotWednesday = TimeSlot.create(new Date('2026-10-21T14:00:00.000Z'), 60);
    expect(availability.isAvailableFor(slotWednesday)).toBe(false);
  });
});
