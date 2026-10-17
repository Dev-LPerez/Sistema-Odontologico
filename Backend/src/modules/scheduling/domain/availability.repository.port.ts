import { WeeklyAvailability } from './weekly-availability.entity';

export interface AvailabilityRepositoryPort {
  save(availability: WeeklyAvailability): Promise<void>;
  findByClinicId(clinicId: string): Promise<WeeklyAvailability | null>;
}

export const AVAILABILITY_REPOSITORY = Symbol('AVAILABILITY_REPOSITORY');
