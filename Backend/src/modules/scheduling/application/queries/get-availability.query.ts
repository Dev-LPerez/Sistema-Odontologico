import { Inject, Injectable } from '@nestjs/common';
import {
  AVAILABILITY_REPOSITORY,
  AvailabilityRepositoryPort,
} from '../../domain/availability.repository.port';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';

@Injectable()
export class GetAvailabilityQuery {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepo: AvailabilityRepositoryPort,
  ) {}

  async execute(clinicId: string): Promise<WeeklyAvailability | null> {
    return this.availabilityRepo.findByClinicId(clinicId);
  }
}
