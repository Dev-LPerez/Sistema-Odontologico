import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProcedurePerformedDto {
  @ApiProperty({ description: 'Código del procedimiento', example: 'RES-01' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({
    description: 'Nombre del procedimiento',
    example: 'Resina de fotocurado',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({
    description: 'Diente FDI tratado',
    example: '16',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  toothNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Superficie tratada',
    example: 'OCCLUSAL',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  surface?: string | null;

  @ApiPropertyOptional({
    description: 'Notas del procedimiento',
    example: 'Cavidad profunda',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class CreateClinicalAttentionDto {
  @ApiProperty({ description: 'ID del paciente', example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({
    description: 'Notas de evolución clínica obligatorias',
    example: 'Se realiza apertura cavitaria y obturación con resina en pieza 16',
  })
  @IsString()
  @IsNotEmpty()
  evolutionNotes!: string;

  @ApiPropertyOptional({
    description: 'Fórmula médica o prescripción',
    example: 'Ibuprofeno 400mg cada 8 horas por 3 días',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  prescription?: string | null;

  @ApiPropertyOptional({
    description: 'Indicaciones postoperatorias',
    example: 'Evitar alimentos duros por 24 horas',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  postOperativeIndications?: string | null;

  @ApiPropertyOptional({
    description:
      'Notas privadas exclusivas de la doctora (estrictamente ocultas para el rol AUXILIARY)',
    example: 'Paciente con ansiedad dental moderada, cobrar saldo',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  privateNotes?: string | null;

  @ApiPropertyOptional({
    description: 'Procedimientos clínicos realizados en la atención',
    type: () => [ProcedurePerformedDto],
    example: [{ code: 'RES-01', toothNumber: '16', surface: 'OCCLUSAL' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedurePerformedDto)
  proceduresPerformed?: ProcedurePerformedDto[];

  @ApiPropertyOptional({
    description: 'Fecha y hora en que se realizó la atención (UTC)',
    example: '2026-10-16T15:00:00.000Z',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  attendedAt?: string;
}
