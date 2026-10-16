import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';

export class AttentionMaterialUsedResponseDto {
  @ApiProperty({ description: 'ID del registro de material usado' })
  id!: string;

  @ApiProperty({ description: 'ID del consultorio' })
  clinicId!: string;

  @ApiProperty({ description: 'ID de la atención clínica' })
  attentionId!: string;

  @ApiProperty({ description: 'ID del material en el catálogo' })
  materialId!: string;

  @ApiProperty({ description: 'Marca del material', example: '3M' })
  brand!: string;

  @ApiProperty({ description: 'Referencia del material', example: 'Filtek Z350 XT' })
  reference!: string;

  @ApiProperty({ description: 'Tipo de material', example: 'Resina compuesta' })
  type!: string;

  @ApiProperty({ description: 'Color del material', example: 'A2' })
  color!: string;

  @ApiPropertyOptional({
    description: 'Diente FDI tratado',
    example: '16',
    type: String,
    nullable: true,
  })
  toothNumber!: string | null;

  @ApiProperty({ description: 'Cantidad consumida', example: 1 })
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Notas u observaciones del uso',
    example: 'Restauración oclusal',
    type: String,
    nullable: true,
  })
  notes!: string | null;

  @ApiProperty({ description: 'Fecha de registro del material usado (UTC)' })
  createdAt!: string;
}

export class ClinicalAttentionResponseDto {
  @ApiProperty({ description: 'ID de la atención clínica' })
  id!: string;

  @ApiProperty({ description: 'ID del consultorio' })
  clinicId!: string;

  @ApiProperty({ description: 'ID del paciente' })
  patientId!: string;

  @ApiProperty({ description: 'ID de la historia clínica asociada' })
  clinicalHistoryId!: string;

  @ApiProperty({ description: 'ID del usuario profesional que atendió la cita' })
  attendedByUserId!: string;

  @ApiProperty({
    description: 'Estado de la atención clínica',
    enum: ClinicalAttentionStatus,
    example: ClinicalAttentionStatus.OPEN,
  })
  status!: ClinicalAttentionStatus;

  @ApiProperty({
    description: 'Procedimientos clínicos realizados',
    type: [Object],
    example: [{ code: 'RES-01', toothNumber: '16', surface: 'OCCLUSAL' }],
  })
  proceduresPerformed!: unknown[];

  @ApiProperty({
    description: 'Notas de evolución clínica',
    example: 'Se realiza apertura cavitaria y obturación con resina en pieza 16',
  })
  evolutionNotes!: string;

  @ApiPropertyOptional({
    description: 'Prescripción o fórmula médica',
    example: 'Ibuprofeno 400mg cada 8 horas por 3 días',
    type: String,
    nullable: true,
  })
  prescription!: string | null;

  @ApiPropertyOptional({
    description: 'Indicaciones postoperatorias para el paciente',
    example: 'Evitar alimentos duros durante las primeras horas',
    type: String,
    nullable: true,
  })
  postOperativeIndications!: string | null;

  @ApiPropertyOptional({
    description: 'Notas privadas exclusivas de la doctora (null para rol AUXILIARY)',
    example: 'Paciente con ansiedad dental moderada',
    type: String,
    nullable: true,
  })
  privateNotes!: string | null;

  @ApiProperty({ description: 'Fecha y hora de la atención (UTC)' })
  attendedAt!: string;

  @ApiProperty({ description: 'Fecha de creación del registro (UTC)' })
  createdAt!: string;

  @ApiProperty({ description: 'Fecha de última actualización del registro (UTC)' })
  updatedAt!: string;

  @ApiProperty({
    description: 'Materiales propios utilizados en la atención clínica',
    type: [AttentionMaterialUsedResponseDto],
  })
  materialsUsed!: AttentionMaterialUsedResponseDto[];

  static fromDomain(attention: ClinicalAttention): ClinicalAttentionResponseDto {
    const dto = new ClinicalAttentionResponseDto();
    dto.id = attention.id;
    dto.clinicId = attention.clinicId;
    dto.patientId = attention.patientId;
    dto.clinicalHistoryId = attention.clinicalHistoryId;
    dto.attendedByUserId = attention.attendedByUserId;
    dto.status = attention.status;
    dto.proceduresPerformed = attention.proceduresPerformed;
    dto.evolutionNotes = attention.evolutionNotes;
    dto.prescription = attention.prescription;
    dto.postOperativeIndications = attention.postOperativeIndications;
    dto.privateNotes = attention.privateNotes;
    dto.attendedAt = attention.attendedAt.toISOString();
    dto.createdAt = attention.createdAt.toISOString();
    dto.updatedAt = attention.updatedAt.toISOString();
    dto.materialsUsed = (attention.materialsUsed || []).map((m) => {
      const matDto = new AttentionMaterialUsedResponseDto();
      matDto.id = m.id;
      matDto.clinicId = m.clinicId;
      matDto.attentionId = m.attentionId;
      matDto.materialId = m.materialId;
      matDto.brand = m.brand;
      matDto.reference = m.reference;
      matDto.type = m.type;
      matDto.color = m.color;
      matDto.toothNumber = m.toothNumber;
      matDto.quantity = m.quantity;
      matDto.notes = m.notes;
      matDto.createdAt = m.createdAt.toISOString();
      return matDto;
    });

    return dto;
  }
}
