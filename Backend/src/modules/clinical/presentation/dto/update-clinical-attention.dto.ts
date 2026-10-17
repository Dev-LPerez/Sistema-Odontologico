import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcedurePerformedDto } from './create-clinical-attention.dto';

export class UpdateClinicalAttentionDto {
  @ApiPropertyOptional({
    description: 'Notas de evolución clínica',
    example: 'Se revisa obturación en pieza 16 y se realiza pulido final',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  evolutionNotes?: string;

  @ApiPropertyOptional({
    description: 'Fórmula médica o prescripción',
    example: 'Paracetamol 500mg cada 6 horas en caso de dolor',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  prescription?: string | null;

  @ApiPropertyOptional({
    description: 'Indicaciones postoperatorias',
    example: 'Higiene bucal cuidadosa con cepillo suave',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  postOperativeIndications?: string | null;

  @ApiPropertyOptional({
    description: 'Notas privadas exclusivas de la doctora',
    example: 'Comportamiento excelente en consulta',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  privateNotes?: string | null;

  @ApiPropertyOptional({
    description: 'Procedimientos clínicos realizados',
    type: () => [ProcedurePerformedDto],
    example: [{ code: 'PUL-01', toothNumber: '16' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedurePerformedDto)
  proceduresPerformed?: ProcedurePerformedDto[];
}
