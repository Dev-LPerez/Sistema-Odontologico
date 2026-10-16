import { Inject, Injectable } from '@nestjs/common';
import {
  ODONTOGRAM_REPOSITORY_PORT,
  OdontogramRepositoryPort,
} from '../../domain/odontogram.repository.port';
import {
  ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT,
  OdontogramSnapshotRepositoryPort,
} from '../../domain/odontogram-snapshot.repository.port';
import {
  PATIENT_REPOSITORY_TOKEN,
  PatientRepositoryPort,
  PatientNotFoundError,
} from '../../../patients';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';
import { OdontogramNotFoundError } from '../../domain/clinical.errors';

export interface CreateOdontogramSnapshotCommand {
  clinicId: string;
  patientId: string;
  notes?: string | null;
}

@Injectable()
export class CreateOdontogramSnapshotUseCase {
  constructor(
    @Inject(ODONTOGRAM_REPOSITORY_PORT)
    private readonly odontogramRepository: OdontogramRepositoryPort,
    @Inject(ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT)
    private readonly snapshotRepository: OdontogramSnapshotRepositoryPort,
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepository: PatientRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreateOdontogramSnapshotCommand): Promise<OdontogramSnapshot> {
    const patient = await this.patientRepository.findById(command.clinicId, command.patientId);
    if (!patient || patient.clinicId !== command.clinicId) {
      throw new PatientNotFoundError(command.patientId);
    }

    const odontogram = await this.odontogramRepository.findByPatientId(
      command.clinicId,
      command.patientId,
    );
    if (!odontogram) {
      throw new OdontogramNotFoundError(command.patientId);
    }

    const snapshotData = odontogram.toStructuredJson();
    const snapshot = OdontogramSnapshot.create({
      id: this.idGenerator.generate(),
      clinicId: command.clinicId,
      patientId: command.patientId,
      odontogramId: odontogram.id,
      hasTemporalDentition: odontogram.hasTemporalDentition,
      snapshotData: snapshotData as unknown as Record<string, unknown>,
      notes: command.notes,
      createdAt: this.clock.now(),
    });

    await this.snapshotRepository.save(snapshot);
    return snapshot;
  }
}
