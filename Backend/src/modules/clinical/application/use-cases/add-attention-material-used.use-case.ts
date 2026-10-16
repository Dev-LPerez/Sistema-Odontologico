import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import {
  UNIT_OF_WORK_PORT,
  UnitOfWorkPort,
} from '../../../../shared/application/ports/unit-of-work.port';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import { ConsumeMaterialStockUseCase } from '../../../catalogs';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { AttentionMaterialUsed } from '../../domain/attention-material-used.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import {
  ClinicalAttentionNotFoundError,
  ClinicalAttentionClosedError,
} from '../../domain/clinical.errors';

export interface AddAttentionMaterialUsedCommand {
  clinicId: string;
  attentionId: string;
  materialId: string;
  quantity: number;
  toothNumber?: string | null;
  notes?: string | null;
}

@Injectable()
export class AddAttentionMaterialUsedUseCase {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly consumeMaterialStockUseCase: ConsumeMaterialStockUseCase,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: AddAttentionMaterialUsedCommand): Promise<ClinicalAttention> {
    return this.unitOfWork.execute(async () => {
      const attention = await this.attentionRepository.findById(
        command.clinicId,
        command.attentionId,
      );
      if (!attention || attention.clinicId !== command.clinicId) {
        throw new ClinicalAttentionNotFoundError(command.attentionId);
      }

      if (attention.status === ClinicalAttentionStatus.CLOSED) {
        throw new ClinicalAttentionClosedError(command.attentionId);
      }

      const updatedMaterial = await this.consumeMaterialStockUseCase.execute({
        clinicId: command.clinicId,
        materialId: command.materialId,
        quantity: command.quantity,
      });

      const now = this.clock.now();
      const materialUsedId = this.idGenerator.generate();

      const materialUsed = AttentionMaterialUsed.create({
        id: materialUsedId,
        clinicId: command.clinicId,
        attentionId: command.attentionId,
        materialId: command.materialId,
        brand: updatedMaterial.brand,
        reference: updatedMaterial.reference,
        type: updatedMaterial.type,
        color: updatedMaterial.color,
        toothNumber: command.toothNumber,
        quantity: command.quantity,
        notes: command.notes,
        createdAt: now,
      });

      attention.addMaterialUsed(materialUsed, now);
      await this.attentionRepository.save(attention);

      return attention;
    });
  }
}
