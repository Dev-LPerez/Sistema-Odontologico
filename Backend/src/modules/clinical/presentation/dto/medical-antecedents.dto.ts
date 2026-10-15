import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PersonalAntecedentsDto {
  @ApiProperty({ description: 'Hipertensión arterial', example: false })
  @IsBoolean()
  hypertension!: boolean;

  @ApiProperty({ description: 'Diabetes', example: false })
  @IsBoolean()
  diabetes!: boolean;

  @ApiProperty({ description: 'Alergias conocidas', example: true })
  @IsBoolean()
  allergies!: boolean;

  @ApiPropertyOptional({
    description: 'Detalle de alergias (obligatorio si allergies es true)',
    example: 'Penicilina',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  allergiesDetails?: string | null;

  @ApiProperty({ description: 'Medicación activa', example: false })
  @IsBoolean()
  medications!: boolean;

  @ApiPropertyOptional({
    description: 'Detalle de medicamentos (obligatorio si medications es true)',
    example: 'Losartán 50mg',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  medicationsDetails?: string | null;

  @ApiProperty({ description: 'Trastornos hemorrágicos o de coagulación', example: false })
  @IsBoolean()
  bleedingDisorders!: boolean;

  @ApiProperty({ description: 'Estado de embarazo', example: false })
  @IsBoolean()
  pregnancy!: boolean;

  @ApiPropertyOptional({
    description: 'Otras observaciones médicas',
    example: 'Sin antecedentes quirúrgicos',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  otherNotes?: string | null;
}

export class UpdatePersonalAntecedentsDto {
  @ApiPropertyOptional({ description: 'Hipertensión arterial', example: false })
  @IsOptional()
  @IsBoolean()
  hypertension?: boolean;

  @ApiPropertyOptional({ description: 'Diabetes', example: false })
  @IsOptional()
  @IsBoolean()
  diabetes?: boolean;

  @ApiPropertyOptional({ description: 'Alergias conocidas', example: true })
  @IsOptional()
  @IsBoolean()
  allergies?: boolean;

  @ApiPropertyOptional({
    description: 'Detalle de alergias',
    example: 'Penicilina',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  allergiesDetails?: string | null;

  @ApiPropertyOptional({ description: 'Medicación activa', example: false })
  @IsOptional()
  @IsBoolean()
  medications?: boolean;

  @ApiPropertyOptional({
    description: 'Detalle de medicamentos',
    example: 'Losartán 50mg',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  medicationsDetails?: string | null;

  @ApiPropertyOptional({ description: 'Trastornos hemorrágicos', example: false })
  @IsOptional()
  @IsBoolean()
  bleedingDisorders?: boolean;

  @ApiPropertyOptional({ description: 'Estado de embarazo', example: false })
  @IsOptional()
  @IsBoolean()
  pregnancy?: boolean;

  @ApiPropertyOptional({
    description: 'Otras observaciones médicas',
    example: 'Sin antecedentes adicionales',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  otherNotes?: string | null;
}
