import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import {
  PATIENT_REPOSITORY_TOKEN,
  PatientRepositoryPort,
  PatientNotFoundError,
} from '../../../patients';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
  ProcedureNotFoundError,
} from '../../../catalogs';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import { ClinicalAttention, ProcedurePerformed } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';

export interface CreateClinicalAttentionCommand {
  clinicId: string;
  patientId: string;
  attendedByUserId: string;
  proceduresPerformed?: ProcedurePerformed[];
  evolutionNotes: string;
  prescription?: string | null;
  postOperativeIndications?: string | null;
  privateNotes?: string | null;
  attendedAt?: Date;
}

@Injectable()
export class CreateClinicalAttentionUseCase {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepository: ClinicalHistoryRepositoryPort,
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepository: PatientRepositoryPort,
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreateClinicalAttentionCommand): Promise<ClinicalAttention> {
    const patient = await this.patientRepository.findById(command.clinicId, command.patientId);
    if (!patient || patient.clinicId !== command.clinicId) {
      throw new PatientNotFoundError(command.patientId);
    }

    const history = await this.historyRepository.findByPatientId(
      command.clinicId,
      command.patientId,
    );
    if (!history) {
      throw new ClinicalHistoryNotFoundError(command.patientId);
    }

    const now = this.clock.now();
    const id = this.idGenerator.generate();
    const attendedAt = command.attendedAt ?? now;

    const procedures: ProcedurePerformed[] = [];
    if (command.proceduresPerformed && command.proceduresPerformed.length > 0) {
      for (const item of command.proceduresPerformed) {
        const procedure = await this.procedureRepository.findByCode(command.clinicId, item.code);
        if (!procedure) {
          throw new ProcedureNotFoundError(item.code);
        }
        procedures.push({
          ...item,
          name: item.name ?? procedure.name,
        });
      }
    }

    const attention = ClinicalAttention.create({
      id,
      clinicId: command.clinicId,
      patientId: command.patientId,
      clinicalHistoryId: history.id,
      attendedByUserId: command.attendedByUserId,
      status: ClinicalAttentionStatus.OPEN,
      proceduresPerformed: procedures,
      evolutionNotes: command.evolutionNotes,
      prescription: command.prescription,
      postOperativeIndications: command.postOperativeIndications,
      privateNotes: command.privateNotes,
      attendedAt,
      createdAt: now,
      updatedAt: now,
      materialsUsed: [],
    });

    await this.attentionRepository.save(attention);
    return attention;
  }
}
