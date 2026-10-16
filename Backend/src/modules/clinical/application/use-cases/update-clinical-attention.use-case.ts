import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
  ProcedureNotFoundError,
} from '../../../catalogs';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalAttention, ProcedurePerformed } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionNotFoundError } from '../../domain/clinical.errors';

export interface UpdateClinicalAttentionCommand {
  clinicId: string;
  id: string;
  evolutionNotes?: string;
  prescription?: string | null;
  postOperativeIndications?: string | null;
  privateNotes?: string | null;
  proceduresPerformed?: ProcedurePerformed[];
}

@Injectable()
export class UpdateClinicalAttentionUseCase {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: UpdateClinicalAttentionCommand): Promise<ClinicalAttention> {
    const attention = await this.attentionRepository.findById(command.clinicId, command.id);
    if (!attention || attention.clinicId !== command.clinicId) {
      throw new ClinicalAttentionNotFoundError(command.id);
    }

    let procedures: ProcedurePerformed[] | undefined;
    if (command.proceduresPerformed !== undefined) {
      procedures = [];
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

    const now = this.clock.now();

    attention.update({
      evolutionNotes: command.evolutionNotes,
      prescription: command.prescription,
      postOperativeIndications: command.postOperativeIndications,
      privateNotes: command.privateNotes,
      proceduresPerformed: procedures,
      updatedAt: now,
    });

    await this.attentionRepository.save(attention);
    return attention;
  }
}
