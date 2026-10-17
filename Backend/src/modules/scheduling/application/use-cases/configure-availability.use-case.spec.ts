import { ConfigureAvailabilityUseCase } from './configure-availability.use-case';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { InvalidAvailabilityConfigurationException } from '../../domain/scheduling.errors';

class FakeAvailabilityRepository implements AvailabilityRepositoryPort {
  private availability: WeeklyAvailability | null = null;

  async save(availability: WeeklyAvailability): Promise<void> {
    this.availability = availability;
  }

  async findByClinicId(clinicId: string): Promise<WeeklyAvailability | null> {
    if (this.availability?.clinicId === clinicId) {
      return this.availability;
    }
    return null;
  }
}

describe('ConfigureAvailabilityUseCase', () => {
  let useCase: ConfigureAvailabilityUseCase;
  let availabilityRepo: FakeAvailabilityRepository;
  let fakeClock: ClockPort;
  const fixedNow = new Date('2026-10-20T10:00:00.000Z');

  beforeEach(() => {
    availabilityRepo = new FakeAvailabilityRepository();
    fakeClock = {
      now: jest.fn().mockReturnValue(fixedNow),
      todayInBogota: jest.fn().mockReturnValue('2026-10-20'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-20 05:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    useCase = new ConfigureAvailabilityUseCase(availabilityRepo, fakeClock);
  });

  it('should create new weekly availability when none exists', async () => {
    const result = await useCase.execute({
      clinicId: 'clinic-123',
      slots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
      ],
      maxDailyAppointments: 4,
    });

    expect(result.clinicId).toBe('clinic-123');
    expect(result.slots).toHaveLength(2);
    expect(result.maxDailyAppointments).toBe(4);
    expect(result.createdAt).toEqual(fixedNow);
  });

  it('should update existing weekly availability when one already exists', async () => {
    await useCase.execute({
      clinicId: 'clinic-123',
      slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
      maxDailyAppointments: 3,
    });

    const updatedNow = new Date('2026-10-21T10:00:00.000Z');
    (fakeClock.now as jest.Mock).mockReturnValue(updatedNow);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      slots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 2, startTime: '14:00', endTime: '18:00' },
      ],
      maxDailyAppointments: 4,
    });

    expect(result.slots).toHaveLength(2);
    expect(result.maxDailyAppointments).toBe(4);
    expect(result.updatedAt).toEqual(updatedNow);
  });

  it('should reject invalid configuration with startTime before 09:00', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        slots: [{ dayOfWeek: 1, startTime: '08:00', endTime: '17:00' }],
      }),
    ).rejects.toThrow(InvalidAvailabilityConfigurationException);
  });
});
