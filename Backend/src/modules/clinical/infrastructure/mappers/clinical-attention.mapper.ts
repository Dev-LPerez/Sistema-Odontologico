import {
  ClinicalAttention as PrismaClinicalAttention,
  AttentionMaterialUsed as PrismaAttentionMaterialUsed,
  ClinicalAttentionStatus as PrismaClinicalAttentionStatus,
  ClinicalAttentionVersion as PrismaClinicalAttentionVersion,
  Prisma,
} from '@prisma/client';
import { ClinicalAttention, ProcedurePerformed } from '../../domain/clinical-attention.entity';
import { AttentionMaterialUsed } from '../../domain/attention-material-used.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import {
  ClinicalAttentionVersion,
  AttentionSnapshotData,
} from '../../domain/clinical-attention-version.entity';

export type PrismaClinicalAttentionWithMaterials = PrismaClinicalAttention & {
  materialsUsed?: PrismaAttentionMaterialUsed[];
};

export class ClinicalAttentionMapper {
  static toDomain(raw: PrismaClinicalAttentionWithMaterials): ClinicalAttention {
    const materials = (raw.materialsUsed || []).map((m) =>
      AttentionMaterialUsed.create({
        id: m.id,
        clinicId: m.clinicId,
        attentionId: m.attentionId,
        materialId: m.materialId,
        brand: m.brand,
        reference: m.reference,
        type: m.type,
        color: m.color,
        toothNumber: m.toothNumber,
        quantity: m.quantity,
        notes: m.notes,
        createdAt: m.createdAt,
      }),
    );

    const proceduresPerformed: ProcedurePerformed[] = Array.isArray(raw.proceduresPerformed)
      ? (raw.proceduresPerformed as unknown as ProcedurePerformed[])
      : [];

    return ClinicalAttention.create({
      id: raw.id,
      clinicId: raw.clinicId,
      patientId: raw.patientId,
      clinicalHistoryId: raw.clinicalHistoryId,
      attendedByUserId: raw.attendedByUserId,
      status: raw.status as ClinicalAttentionStatus,
      proceduresPerformed,
      evolutionNotes: raw.evolutionNotes,
      prescription: raw.prescription,
      postOperativeIndications: raw.postOperativeIndications,
      privateNotes: raw.privateNotes,
      attendedAt: raw.attendedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      materialsUsed: materials,
    });
  }

  static toPrisma(domain: ClinicalAttention): {
    header: Prisma.ClinicalAttentionUncheckedCreateInput;
    materials: Prisma.AttentionMaterialUsedUncheckedCreateInput[];
  } {
    const header: Prisma.ClinicalAttentionUncheckedCreateInput = {
      id: domain.id,
      clinicId: domain.clinicId,
      patientId: domain.patientId,
      clinicalHistoryId: domain.clinicalHistoryId,
      attendedByUserId: domain.attendedByUserId,
      status: domain.status as PrismaClinicalAttentionStatus,
      proceduresPerformed: domain.proceduresPerformed as unknown as Prisma.InputJsonValue,
      evolutionNotes: domain.evolutionNotes,
      prescription: domain.prescription,
      postOperativeIndications: domain.postOperativeIndications,
      privateNotes: domain.privateNotes,
      attendedAt: domain.attendedAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };

    const materials: Prisma.AttentionMaterialUsedUncheckedCreateInput[] = domain.materialsUsed.map(
      (m) => ({
        id: m.id,
        clinicId: m.clinicId,
        attentionId: m.attentionId,
        materialId: m.materialId,
        brand: m.brand,
        reference: m.reference,
        type: m.type,
        color: m.color,
        toothNumber: m.toothNumber,
        quantity: m.quantity,
        notes: m.notes,
        createdAt: m.createdAt,
      }),
    );

    return { header, materials };
  }

  static versionToDomain(raw: PrismaClinicalAttentionVersion): ClinicalAttentionVersion {
    return ClinicalAttentionVersion.create({
      id: raw.id,
      clinicId: raw.clinicId,
      attentionId: raw.attentionId,
      versionNumber: raw.versionNumber,
      previousData: raw.previousData as unknown as AttentionSnapshotData,
      changeReason: raw.changeReason,
      amendedByUserId: raw.amendedByUserId,
      createdAt: raw.createdAt,
    });
  }

  static versionToPrisma(
    domain: ClinicalAttentionVersion,
  ): Prisma.ClinicalAttentionVersionUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      attentionId: domain.attentionId,
      versionNumber: domain.versionNumber,
      previousData: domain.previousData as unknown as Prisma.InputJsonValue,
      changeReason: domain.changeReason,
      amendedByUserId: domain.amendedByUserId,
      createdAt: domain.createdAt,
    };
  }
}
