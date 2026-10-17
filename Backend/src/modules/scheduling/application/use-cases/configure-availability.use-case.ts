import { Inject, Injectable } from '@nestjs/common';
import {
  AVAILABILITY_REPOSITORY,
  AvailabilityRepositoryPort,
} from '../../domain/availability.repository.port';
import { AvailabilitySlotItem, WeeklyAvailability } from '../../domain/weekly-availability.entity';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';

export interface ConfigureAvailabilityCommand {
  clinicId: string;
  slots: AvailabilitySlotItem[];
  maxDailyAppointments?: number;
}

@Injectable()
export class ConfigureAvailabilityUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepo: AvailabilityRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: ConfigureAvailabilityCommand): Promise<WeeklyAvailability> {
    const now = this.clock.now();
    const existing = await this.availabilityRepo.findByClinicId(command.clinicId);

    if (existing) {
      existing.update(command.slots, command.maxDailyAppointments ?? 4, now);
      await this.availabilityRepo.save(existing);
      return existing;
    }

    const availability = WeeklyAvailability.create({
      clinicId: command.clinicId,
      slots: command.slots,
      maxDailyAppointments: command.maxDailyAppointments ?? 4,
      createdAt: now,
      updatedAt: now,
    });

    await this.availabilityRepo.save(availability);
    return availability;
  }
}
