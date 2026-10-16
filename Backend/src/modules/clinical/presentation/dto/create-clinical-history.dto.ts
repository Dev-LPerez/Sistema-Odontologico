import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PersonalAntecedentsDto } from './medical-antecedents.dto';
import { ClinicalDiagnosisDto } from './clinical-diagnosis.dto';

export class CreateClinicalHistoryDto {
  @ApiProperty({ description: 'ID del paciente', example: 'd3b07384-d113-494b-9c8e-aa6725345759' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'Motivo de consulta', example: 'Dolor agudo en molar superior' })
  @IsString()
  @IsNotEmpty()
  chiefComplaint!: string;

  @ApiProperty({
    description: 'Enfermedad actual',
    example: 'Paciente refiere dolor pulsátil de 3 días de evolución',
  })
  @IsString()
  @IsNotEmpty()
  currentIllness!: string;

  @ApiProperty({ description: 'Antecedentes médicos personales' })
  @ValidateNested()
  @Type(() => PersonalAntecedentsDto)
  personalAntecedents!: PersonalAntecedentsDto;

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
    example: 'Pieza 16 con cavidad oclusal profunda',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  clinicalExamination?: string | null;

  @ApiPropertyOptional({
    description: 'Diagnósticos clínicos (CIE-10 o descripción)',
    example: [{ code: 'K02.1', description: 'Caries de la dentina' }],
    type: () => [ClinicalDiagnosisDto],
  })
  @IsOptional()
  @IsArray()
  diagnoses?: unknown[];
}
