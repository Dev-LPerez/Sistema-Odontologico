import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import {
  CLINICAL_HISTORY_VERSION_REPOSITORY_PORT,
  ClinicalHistoryVersionRepositoryPort,
} from '../../domain/clinical-history-version.repository.port';
import {
  UNIT_OF_WORK_PORT,
  UnitOfWorkPort,
} from '../../../../shared/application/ports/unit-of-work.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { ClinicalHistoryVersion } from '../../domain/clinical-history-version.entity';
import { MedicalAntecedents, MedicalAntecedentsProps } from '../../domain/medical-antecedents.vo';
import { PlainClinicalDiagnosis } from '../../domain/clinical-diagnosis.vo';

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
  diagnoses?: Array<PlainClinicalDiagnosis | string>;
  changeReason?: string;
  updatedByUserId?: string;
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
    @Inject(CLINICAL_HISTORY_VERSION_REPOSITORY_PORT)
    private readonly versionRepository: ClinicalHistoryVersionRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: UpdateClinicalHistoryCommand): Promise<ClinicalHistory> {
    return this.unitOfWork.execute(async () => {
      const history = await this.historyRepository.findByPatientId(
        command.clinicId,
        command.patientId,
      );
      if (!history) {
        throw new ClinicalHistoryNotFoundError(command.patientId);
      }

      const existingVersions = await this.versionRepository.findAllByHistoryId(
        command.clinicId,
        history.id,
      );
      const nextVersionNumber = existingVersions.length + 1;
      const now = this.clock.now();
      const versionId = this.idGenerator.generate();

      const version = ClinicalHistoryVersion.create({
        id: versionId,
        clinicId: command.clinicId,
        clinicalHistoryId: history.id,
        versionNumber: nextVersionNumber,
        previousData: history.toSnapshotData(),
        changeReason: command.changeReason,
        updatedByUserId: command.updatedByUserId,
        createdAt: now,
      });

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
        updatedAt: now,
      });

      await this.versionRepository.save(version);
      await this.historyRepository.save(history);
      return history;
    });
  }
}
