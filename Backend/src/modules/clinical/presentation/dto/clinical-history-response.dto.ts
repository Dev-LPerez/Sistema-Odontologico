import { ApiProperty } from '@nestjs/swagger';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';
import { TreatmentPlanItem } from '../../domain/treatment-plan-item.entity';
import { ClinicalHistory } from '../../domain/clinical-history.entity';

export class TreatmentPlanItemResponseDto {
  @ApiProperty({ example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  id!: string;

  @ApiProperty({ example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  clinicId!: string;

  @ApiProperty({ example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  clinicalHistoryId!: string;

  @ApiProperty({ example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  procedureId!: string;

  @ApiProperty({ example: 'RES-EST' })
  procedureCode!: string;

  @ApiProperty({ example: 'Resina Estética' })
  procedureName!: string;

  @ApiProperty({ example: '16', type: String, nullable: true })
  toothNumber!: string | null;

  @ApiProperty({ enum: TreatmentItemStatus, example: TreatmentItemStatus.PENDING })
  status!: TreatmentItemStatus;

  @ApiProperty({ example: 150000 })
  estimatedCostCop!: number;

  @ApiProperty({ example: 'Aislamiento absoluto', type: String, nullable: true })
  notes!: string | null;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  updatedAt!: string;

  static fromDomain(item: TreatmentPlanItem): TreatmentPlanItemResponseDto {
    return {
      id: item.id,
      clinicId: item.clinicId,
      clinicalHistoryId: item.clinicalHistoryId,
      procedureId: item.procedureId,
      procedureCode: item.procedureCode,
      procedureName: item.procedureName,
      toothNumber: item.toothNumber,
      status: item.status,
      estimatedCostCop: item.estimatedCostCop,
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

export class ClinicalHistoryResponseDto {
  @ApiProperty({ example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  id!: string;

  @ApiProperty({ example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  clinicId!: string;

  @ApiProperty({ example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  patientId!: string;

  @ApiProperty({ example: 'Dolor agudo en molar superior' })
  chiefComplaint!: string;

  @ApiProperty({ example: 'Evolución de 3 días' })
  currentIllness!: string;

  @ApiProperty({
    example: {
      hypertension: false,
      diabetes: false,
      allergies: true,
      allergiesDetails: 'Penicilina',
      medications: false,
      medicationsDetails: null,
      bleedingDisorders: false,
      pregnancy: false,
      otherNotes: null,
    },
  })
  personalAntecedents!: Record<string, unknown>;

  @ApiProperty({ example: 'Madre hipertensa', type: String, nullable: true })
  familyAntecedents!: string | null;

  @ApiProperty({ example: 'Caries cavitada en 16', type: String, nullable: true })
  clinicalExamination!: string | null;

  @ApiProperty({
    type: [Object],
    example: [{ code: 'K02.1', description: 'Caries de la dentina' }],
  })
  diagnoses!: unknown[];

  @ApiProperty({ type: [TreatmentPlanItemResponseDto] })
  treatmentItems!: TreatmentPlanItemResponseDto[];

  @ApiProperty({ example: 150000 })
  totalEstimatedCostCop!: number;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  updatedAt!: string;

  static fromDomain(history: ClinicalHistory): ClinicalHistoryResponseDto {
    return {
      id: history.id,
      clinicId: history.clinicId,
      patientId: history.patientId,
      chiefComplaint: history.chiefComplaint,
      currentIllness: history.currentIllness,
      personalAntecedents: history.medicalAntecedents.toPersonalAntecedentsJson(),
      familyAntecedents: history.medicalAntecedents.familyAntecedents,
      clinicalExamination: history.clinicalExamination,
      diagnoses: history.diagnoses,
      treatmentItems: history.treatmentItems.map((item) =>
        TreatmentPlanItemResponseDto.fromDomain(item),
      ),
      totalEstimatedCostCop: history.totalEstimatedCostCop,
      createdAt: history.createdAt.toISOString(),
      updatedAt: history.updatedAt.toISOString(),
    };
  }
}
