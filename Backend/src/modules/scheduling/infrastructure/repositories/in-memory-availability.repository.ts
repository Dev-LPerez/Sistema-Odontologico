import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';

export class InMemoryAvailabilityRepository implements AvailabilityRepositoryPort {
  private readonly items = new Map<string, WeeklyAvailability>();

  async save(availability: WeeklyAvailability): Promise<void> {
    this.items.set(availability.clinicId, availability);
  }

  async findByClinicId(clinicId: string): Promise<WeeklyAvailability | null> {
    const item = this.items.get(clinicId);
    return item ?? null;
  }
}
