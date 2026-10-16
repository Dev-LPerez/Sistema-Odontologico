import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import {
  CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT,
  ClinicalAttentionVersionRepositoryPort,
} from '../../domain/clinical-attention-version.repository.port';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
  ProcedureNotFoundError,
} from '../../../catalogs';
import {
  UNIT_OF_WORK_PORT,
  UnitOfWorkPort,
} from '../../../../shared/application/ports/unit-of-work.port';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import { ClinicalAttention, ProcedurePerformed } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionVersion } from '../../domain/clinical-attention-version.entity';
import { ClinicalAttentionNotFoundError } from '../../domain/clinical.errors';

export interface AmendClosedClinicalAttentionCommand {
  clinicId: string;
  id: string;
  amendedByUserId: string;
  changeReason: string;
  evolutionNotes?: string;
  prescription?: string | null;
  postOperativeIndications?: string | null;
  privateNotes?: string | null;
  proceduresPerformed?: ProcedurePerformed[];
}

@Injectable()
export class AmendClosedClinicalAttentionUseCase {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
    @Inject(CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT)
    private readonly versionRepository: ClinicalAttentionVersionRepositoryPort,
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: AmendClosedClinicalAttentionCommand): Promise<ClinicalAttention> {
    return this.unitOfWork.execute(async () => {
      const attention = await this.attentionRepository.findById(command.clinicId, command.id);
      if (!attention || attention.clinicId !== command.clinicId) {
        throw new ClinicalAttentionNotFoundError(command.id);
      }

      const existingVersions = await this.versionRepository.findAllByAttentionId(
        command.clinicId,
        command.id,
      );
      const nextVersionNumber = existingVersions.length + 1;
      const now = this.clock.now();
      const versionId = this.idGenerator.generate();

      const version = ClinicalAttentionVersion.create({
        id: versionId,
        clinicId: command.clinicId,
        attentionId: command.id,
        versionNumber: nextVersionNumber,
        previousData: attention.toSnapshotData(),
        changeReason: command.changeReason,
        amendedByUserId: command.amendedByUserId,
        createdAt: now,
      });

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

      attention.amend({
        changeReason: command.changeReason,
        evolutionNotes: command.evolutionNotes,
        prescription: command.prescription,
        postOperativeIndications: command.postOperativeIndications,
        privateNotes: command.privateNotes,
        proceduresPerformed: procedures,
        updatedAt: now,
      });

      await this.versionRepository.save(version);
      await this.attentionRepository.save(attention);

      return attention;
    });
  }
}
