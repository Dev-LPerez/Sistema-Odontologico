import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents, MedicalAntecedentsProps } from '../../domain/medical-antecedents.vo';

export interface UpdateClinicalHistoryCommand {
  clinicId: string;
  patientId: string;
  chiefComplaint?: string;
  currentIllness?: string;
  personalAntecedents?: {
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

function mergeMedicalAntecedents(
  current: MedicalAntecedents,
  personal?: UpdateClinicalHistoryCommand['personalAntecedents'],
  family?: string | null,
): MedicalAntecedents {
  const base: MedicalAntecedentsProps = {
    hypertension: current.hypertension,
    diabetes: current.diabetes,
    allergies: current.allergies,
    allergiesDetails: current.allergiesDetails,
    medications: current.medications,
    medicationsDetails: current.medicationsDetails,
    bleedingDisorders: current.bleedingDisorders,
    pregnancy: current.pregnancy,
    otherNotes: current.otherNotes,
    familyAntecedents: current.familyAntecedents,
  };

  const patch: Record<string, unknown> = {};
  if (personal) {
    for (const [key, val] of Object.entries(personal)) {
      if (val !== undefined) {
        patch[key] = val;
      }
    }
  }
  if (family !== undefined) {
    patch.familyAntecedents = family;
  }

  const merged = Object.assign(base, patch);
  return MedicalAntecedents.create(merged);
}

@Injectable()
export class UpdateClinicalHistoryUseCase {
  constructor(
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepository: ClinicalHistoryRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: UpdateClinicalHistoryCommand): Promise<ClinicalHistory> {
    const history = await this.historyRepository.findByPatientId(
      command.clinicId,
      command.patientId,
    );
    if (!history) {
      throw new ClinicalHistoryNotFoundError(command.patientId);
    }

    let medicalAntecedents: MedicalAntecedents | undefined = undefined;
    if (command.personalAntecedents !== undefined || command.familyAntecedents !== undefined) {
      medicalAntecedents = mergeMedicalAntecedents(
        history.medicalAntecedents,
        command.personalAntecedents,
        command.familyAntecedents,
      );
    }

    history.update({
      chiefComplaint: command.chiefComplaint,
      currentIllness: command.currentIllness,
      medicalAntecedents,
      clinicalExamination: command.clinicalExamination,
      diagnoses: command.diagnoses,
      updatedAt: this.clock.now(),
    });

    await this.historyRepository.save(history);
    return history;
  }
}
