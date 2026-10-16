import { Inject, Injectable } from '@nestjs/common';
import {
  ODONTOGRAM_REPOSITORY_PORT,
  OdontogramRepositoryPort,
} from '../../domain/odontogram.repository.port';
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
import { Odontogram } from '../../domain/odontogram.entity';
import { ToothFinding } from '../../domain/tooth-finding.vo';
import { ToothNumber } from '../../domain/tooth-number.vo';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';

export interface FindingCommandItem {
  toothNumber: number | string;
  surface: ToothSurface;
  findingCode: FindingCatalogCode;
  status: FindingStatus;
  notes?: string | null;
}

export interface UpsertPatientOdontogramCommand {
  clinicId: string;
  patientId: string;
  hasTemporalDentition?: boolean;
  findings: FindingCommandItem[];
}

@Injectable()
export class UpsertPatientOdontogramUseCase {
  constructor(
    @Inject(ODONTOGRAM_REPOSITORY_PORT)
    private readonly odontogramRepository: OdontogramRepositoryPort,
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepository: PatientRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: UpsertPatientOdontogramCommand): Promise<Odontogram> {
    const patient = await this.patientRepository.findById(command.clinicId, command.patientId);
    if (!patient || patient.clinicId !== command.clinicId) {
      throw new PatientNotFoundError(command.patientId);
    }

    const domainFindings = command.findings.map((item) =>
      ToothFinding.create({
        toothNumber: ToothNumber.of(item.toothNumber),
        surface: item.surface,
        findingCode: item.findingCode,
        status: item.status,
        notes: item.notes,
        createdAt: this.clock.now(),
      }),
    );

    const existing = await this.odontogramRepository.findByPatientId(
      command.clinicId,
      command.patientId,
    );

    if (existing) {
      existing.updateFindings(domainFindings, command.hasTemporalDentition, this.clock.now());
      await this.odontogramRepository.save(existing);
      return existing;
    }

    const now = this.clock.now();
    const newOdontogram = Odontogram.create({
      id: this.idGenerator.generate(),
      clinicId: command.clinicId,
      patientId: command.patientId,
      hasTemporalDentition: Boolean(command.hasTemporalDentition),
      findings: domainFindings,
      createdAt: now,
      updatedAt: now,
    });

    await this.odontogramRepository.save(newOdontogram);
    return newOdontogram;
  }
}
