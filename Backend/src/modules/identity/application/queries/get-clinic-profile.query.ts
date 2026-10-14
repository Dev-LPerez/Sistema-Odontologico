import { Injectable, Inject } from '@nestjs/common';
import { ClinicNotFoundError } from '../../domain/identity.errors';
import { ClinicRepositoryPort, CLINIC_REPOSITORY_PORT } from '../../domain/clinic.repository.port';

export interface GetClinicProfileQueryRequest {
  clinicId: string;
}

export interface ClinicProfileDto {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetClinicProfileQuery {
  constructor(
    @Inject(CLINIC_REPOSITORY_PORT)
    private readonly clinicRepo: ClinicRepositoryPort,
  ) {}

  async execute(request: GetClinicProfileQueryRequest): Promise<ClinicProfileDto> {
    const clinic = await this.clinicRepo.findById(request.clinicId);
    if (!clinic) {
      throw new ClinicNotFoundError(request.clinicId);
    }

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
