import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePersonalAntecedentsDto } from './medical-antecedents.dto';

export class UpdateClinicalHistoryDto {
  @ApiPropertyOptional({
    description: 'Motivo de consulta',
    example: 'Control y revisión de obturación',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  chiefComplaint?: string;

  @ApiPropertyOptional({
    description: 'Enfermedad actual',
    example: 'Evolución satisfactoria sin dolor',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currentIllness?: string;

  @ApiPropertyOptional({ description: 'Antecedentes médicos personales actualizados' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePersonalAntecedentsDto)
  personalAntecedents?: UpdatePersonalAntecedentsDto;

  @ApiPropertyOptional({
    description: 'Antecedentes médicos familiares',
    example: 'Madre hipertensa',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  familyAntecedents?: string | null;

  @ApiPropertyOptional({
    description: 'Examen clínico e intraoral',
    example: 'Pieza 16 restaurada adecuadamente',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  clinicalExamination?: string | null;

  @ApiPropertyOptional({
    description: 'Diagnósticos clínicos',
    example: [{ code: 'Z01.2', description: 'Examen odontológico' }],
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  diagnoses?: unknown[];
}
