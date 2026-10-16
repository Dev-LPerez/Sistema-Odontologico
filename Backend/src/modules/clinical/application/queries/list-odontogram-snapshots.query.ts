import { Inject, Injectable } from '@nestjs/common';
import {
  ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT,
  OdontogramSnapshotRepositoryPort,
} from '../../domain/odontogram-snapshot.repository.port';
import {
  PATIENT_REPOSITORY_TOKEN,
  PatientRepositoryPort,
  PatientNotFoundError,
} from '../../../patients';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';

export interface ListOdontogramSnapshotsParams {
  clinicId: string;
  patientId: string;
}

@Injectable()
export class ListOdontogramSnapshotsQuery {
  constructor(
    @Inject(ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT)
    private readonly snapshotRepository: OdontogramSnapshotRepositoryPort,
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepository: PatientRepositoryPort,
  ) {}

  async execute(params: ListOdontogramSnapshotsParams): Promise<OdontogramSnapshot[]> {
    const patient = await this.patientRepository.findById(params.clinicId, params.patientId);
    if (!patient || patient.clinicId !== params.clinicId) {
      throw new PatientNotFoundError(params.patientId);
    }

    return await this.snapshotRepository.findAllByPatientId(params.clinicId, params.patientId);
  }
}
