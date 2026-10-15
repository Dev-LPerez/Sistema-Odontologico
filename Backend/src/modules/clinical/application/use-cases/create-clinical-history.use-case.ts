import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import {
  PATIENT_REPOSITORY_TOKEN,
  PatientRepositoryPort,
  PatientNotFoundError,
} from '../../../patients';
import { DuplicateClinicalHistoryError } from '../../domain/clinical.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents, MedicalAntecedentsProps } from '../../domain/medical-antecedents.vo';

export interface CreateClinicalHistoryCommand {
  clinicId: string;
  patientId: string;
  chiefComplaint: string;
  currentIllness: string;
  personalAntecedents: {
    hypertension?: boolean;
    diabetes?: boolean;
    allergies?: boolean;
    allergiesDetails?: string | null;
    medications?: boolean;
    medicationsDetails?: string | null;
    bleedingDisorders?: boolean;
    pregnancy?: boolean;
    otherNotes?: string | null;
  };
  familyAntecedents?: string | null;
  clinicalExamination?: string | null;
  diagnoses?: unknown[];
}

function buildMedicalAntecedents(command: CreateClinicalHistoryCommand): MedicalAntecedents {
  const p = command.personalAntecedents || {};
  const props: MedicalAntecedentsProps = {
    hypertension: Boolean(p.hypertension),
    diabetes: Boolean(p.diabetes),
    allergies: Boolean(p.allergies),
    allergiesDetails: p.allergiesDetails || null,
    medications: Boolean(p.medications),
    medicationsDetails: p.medicationsDetails || null,
    bleedingDisorders: Boolean(p.bleedingDisorders),
    pregnancy: Boolean(p.pregnancy),
    otherNotes: p.otherNotes || null,
    familyAntecedents: command.familyAntecedents || null,
  };
  return MedicalAntecedents.create(props);
}

@Injectable()
export class CreateClinicalHistoryUseCase {
  constructor(
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepository: ClinicalHistoryRepositoryPort,
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepository: PatientRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreateClinicalHistoryCommand): Promise<ClinicalHistory> {
    const patient = await this.patientRepository.findById(command.clinicId, command.patientId);
    if (!patient || patient.clinicId !== command.clinicId) {
      throw new PatientNotFoundError(command.patientId);
    }

    const existing = await this.historyRepository.findByPatientId(
      command.clinicId,
      command.patientId,
    );
    if (existing) {
      throw new DuplicateClinicalHistoryError(command.patientId);
    }

    const antecedents = buildMedicalAntecedents(command);
    const now = this.clock.now();
    const id = this.idGenerator.generate();

    const history = ClinicalHistory.create({
      id,
      clinicId: command.clinicId,
      patientId: command.patientId,
      chiefComplaint: command.chiefComplaint,
      currentIllness: command.currentIllness,
      medicalAntecedents: antecedents,
      clinicalExamination: command.clinicalExamination,
      diagnoses: command.diagnoses,
      createdAt: now,
      updatedAt: now,
    });

    await this.historyRepository.save(history);
    return history;
  }
}
