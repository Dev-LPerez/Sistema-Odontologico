import { Inject, Injectable } from '@nestjs/common';
import {
  ODONTOGRAM_REPOSITORY_PORT,
  OdontogramRepositoryPort,
} from '../../domain/odontogram.repository.port';
import { OdontogramNotFoundError } from '../../domain/clinical.errors';
import { Odontogram } from '../../domain/odontogram.entity';

export interface GetOdontogramByPatientParams {
  clinicId: string;
  patientId: string;
}

@Injectable()
export class GetOdontogramByPatientQuery {
  constructor(
    @Inject(ODONTOGRAM_REPOSITORY_PORT)
    private readonly odontogramRepository: OdontogramRepositoryPort,
  ) {}

  async execute(params: GetOdontogramByPatientParams): Promise<Odontogram> {
    const odontogram = await this.odontogramRepository.findByPatientId(
      params.clinicId,
      params.patientId,
    );

    if (!odontogram) {
      throw new OdontogramNotFoundError(params.patientId);
    }

    return odontogram;
  }
}
