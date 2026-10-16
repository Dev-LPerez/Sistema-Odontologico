import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProcedurePerformedDto } from './create-clinical-attention.dto';

export class AmendClinicalAttentionDto {
  @ApiProperty({
    description: 'Motivo justificado de la enmienda clínica (obligatorio)',
    example: 'Aclaración de dosis y notas de evolución rectificadas',
  })
  @IsString()
  @IsNotEmpty()
  changeReason!: string;

  @ApiPropertyOptional({
    description: 'Notas de evolución clínica rectificadas',
    example: 'Se revisa obturación en pieza 16 y se aclara indicación terapéutica',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  evolutionNotes?: string;

  @ApiPropertyOptional({
    description: 'Fórmula médica o prescripción rectificada',
    example: 'Amoxicilina 875mg cada 12 horas por 7 días',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  prescription?: string | null;

  @ApiPropertyOptional({
    description: 'Indicaciones postoperatorias rectificadas',
    example: 'Reposo relativo y no realizar buches bruscos',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  postOperativeIndications?: string | null;

  @ApiPropertyOptional({
    description: 'Notas privadas exclusivas de la doctora rectificadas',
    example: 'Seguimiento especial requerido en próxima cita',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  privateNotes?: string | null;

  @ApiPropertyOptional({
    description: 'Procedimientos clínicos realizados rectificados',
    type: [Object],
    example: [{ code: 'RES-01', toothNumber: '16' }],
  })
  @IsOptional()
  @IsArray()
  proceduresPerformed?: ProcedurePerformedDto[];
}
