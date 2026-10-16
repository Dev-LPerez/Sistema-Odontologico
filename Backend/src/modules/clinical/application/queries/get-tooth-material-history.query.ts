import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import { ToothNumber } from '../../domain/tooth-number.vo';

export interface GetToothMaterialHistoryParams {
  clinicId: string;
  patientId: string;
  toothNumber: string;
}

export interface ToothMaterialHistoryItem {
  attentionId: string;
  attendedAt: string;
  materialId: string;
  brand: string;
  reference: string;
  type: string;
  color: string;
  toothNumber: string;
  quantity: number;
  notes: string | null;
}

@Injectable()
export class GetToothMaterialHistoryQuery {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
  ) {}

  async execute(params: GetToothMaterialHistoryParams): Promise<ToothMaterialHistoryItem[]> {
    const toothVo = ToothNumber.of(params.toothNumber);
    const normalizedTooth = toothVo.code;

    const attentions = await this.attentionRepository.findAllByPatientId(
      params.clinicId,
      params.patientId,
    );

    // Orden cronológico ascendente por fecha de atención
    const sortedAttentions = [...attentions].sort(
      (a, b) => a.attendedAt.getTime() - b.attendedAt.getTime(),
    );

    const historyItems: ToothMaterialHistoryItem[] = [];

    for (const attention of sortedAttentions) {
      for (const material of attention.materialsUsed) {
        if (material.toothNumber === normalizedTooth) {
          historyItems.push({
            attentionId: attention.id,
            attendedAt: attention.attendedAt.toISOString(),
            materialId: material.materialId,
            brand: material.brand,
            reference: material.reference,
            type: material.type,
            color: material.color,
            toothNumber: normalizedTooth,
            quantity: material.quantity,
            notes: material.notes,
          });
        }
      }
    }

    return historyItems;
  }
}
