import { GetAvailabilityQuery } from './get-availability.query';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';

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

describe('GetAvailabilityQuery', () => {
  let query: GetAvailabilityQuery;
  let repo: FakeAvailabilityRepository;

  beforeEach(() => {
    repo = new FakeAvailabilityRepository();
    query = new GetAvailabilityQuery(repo);
  });

  it('should return null when availability is not configured', async () => {
    const result = await query.execute('clinic-123');
    expect(result).toBeNull();
  });

  it('should return availability when configured', async () => {
    const availability = WeeklyAvailability.create({
      clinicId: 'clinic-123',
      slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
      maxDailyAppointments: 4,
    });
    await repo.save(availability);

    const result = await query.execute('clinic-123');
    expect(result).not.toBeNull();
    expect(result?.clinicId).toBe('clinic-123');
    expect(result?.slots).toHaveLength(1);
  });
});
