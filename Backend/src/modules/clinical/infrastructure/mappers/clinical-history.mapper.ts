import {
  ClinicalHistory as PrismaClinicalHistory,
  TreatmentPlanItem as PrismaTreatmentPlanItem,
  TreatmentItemStatus as PrismaTreatmentItemStatus,
  Prisma,
} from '@prisma/client';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';
import { TreatmentPlanItem } from '../../domain/treatment-plan-item.entity';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';

export type PrismaClinicalHistoryWithItems = PrismaClinicalHistory & {
  treatmentItems?: PrismaTreatmentPlanItem[];
};

export class ClinicalHistoryMapper {
  static toDomain(raw: PrismaClinicalHistoryWithItems): ClinicalHistory {
    const rawAntecedents = (raw.personalAntecedents as Record<string, unknown>) || {};

    const antecedents = MedicalAntecedents.create({
      hypertension: Boolean(rawAntecedents.hypertension),
      diabetes: Boolean(rawAntecedents.diabetes),
      allergies: Boolean(rawAntecedents.allergies),
      allergiesDetails:
        typeof rawAntecedents.allergiesDetails === 'string'
          ? rawAntecedents.allergiesDetails
          : null,
      medications: Boolean(rawAntecedents.medications),
      medicationsDetails:
        typeof rawAntecedents.medicationsDetails === 'string'
          ? rawAntecedents.medicationsDetails
          : null,
      bleedingDisorders: Boolean(rawAntecedents.bleedingDisorders),
      pregnancy: Boolean(rawAntecedents.pregnancy),
      otherNotes: typeof rawAntecedents.otherNotes === 'string' ? rawAntecedents.otherNotes : null,
      familyAntecedents: raw.familyAntecedents,
    });

    const items = (raw.treatmentItems || []).map((item) =>
      TreatmentPlanItem.create({
        id: item.id,
        clinicId: item.clinicId,
        clinicalHistoryId: item.clinicalHistoryId,
        procedureId: item.procedureId,
        procedureCode: item.procedureCode,
        procedureName: item.procedureName,
        toothNumber: item.toothNumber,
        status: item.status as TreatmentItemStatus,
        estimatedCostCop: item.estimatedCostCop,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }),
    );

    const diagnoses = Array.isArray(raw.diagnoses) ? (raw.diagnoses as unknown[]) : [];

    return ClinicalHistory.create({
      id: raw.id,
      clinicId: raw.clinicId,
      patientId: raw.patientId,
      chiefComplaint: raw.chiefComplaint,
      currentIllness: raw.currentIllness,
      medicalAntecedents: antecedents,
      clinicalExamination: raw.clinicalExamination,
      diagnoses,
      treatmentItems: items,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(domain: ClinicalHistory): {
    header: Prisma.ClinicalHistoryUncheckedCreateInput;
    items: Prisma.TreatmentPlanItemUncheckedCreateInput[];
  } {
    const header: Prisma.ClinicalHistoryUncheckedCreateInput = {
      id: domain.id,
      clinicId: domain.clinicId,
      patientId: domain.patientId,
      chiefComplaint: domain.chiefComplaint,
      currentIllness: domain.currentIllness,
      personalAntecedents:
        domain.medicalAntecedents.toPersonalAntecedentsJson() as Prisma.InputJsonValue,
      familyAntecedents: domain.medicalAntecedents.familyAntecedents,
      clinicalExamination: domain.clinicalExamination,
      diagnoses: domain.diagnoses as Prisma.InputJsonValue,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };

    const items: Prisma.TreatmentPlanItemUncheckedCreateInput[] = domain.treatmentItems.map(
      (item) => ({
        id: item.id,
        clinicId: item.clinicId,
        clinicalHistoryId: item.clinicalHistoryId,
        procedureId: item.procedureId,
        procedureCode: item.procedureCode,
        procedureName: item.procedureName,
        toothNumber: item.toothNumber,
        status: item.status as PrismaTreatmentItemStatus,
        estimatedCostCop: item.estimatedCostCop,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }),
    );

    return { header, items };
  }
}
