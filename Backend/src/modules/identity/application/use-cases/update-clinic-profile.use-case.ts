import { Injectable, Inject } from '@nestjs/common';
import { ClinicNotFoundError } from '../../domain/identity.errors';
import { ClinicRepositoryPort, CLINIC_REPOSITORY_PORT } from '../../domain/clinic.repository.port';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';
import { ClinicProfileDto } from '../queries/get-clinic-profile.query';

export interface UpdateClinicProfileCommand {
  clinicId: string;
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  settings?: Record<string, unknown> | null;
}

@Injectable()
export class UpdateClinicProfileUseCase {
  constructor(
    @Inject(CLINIC_REPOSITORY_PORT)
    private readonly clinicRepo: ClinicRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: UpdateClinicProfileCommand): Promise<ClinicProfileDto> {
    const clinic = await this.clinicRepo.findById(command.clinicId);
    if (!clinic) {
      throw new ClinicNotFoundError(command.clinicId);
    }

    const now = this.clock.now();

    clinic.updateDetails({
      name: command.name,
      address: command.address,
      phone: command.phone,
      email: command.email,
      logoUrl: command.logoUrl,
      settings: command.settings,
      updatedAt: now,
    });

    await this.clinicRepo.save(clinic);

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      logoUrl: clinic.logoUrl,
      settings: clinic.settings,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    };
  }
}
