import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClinicalDiagnosisDto {
  @ApiPropertyOptional({
    description: 'Código de diagnóstico CIE-10 u odontológico (opcional)',
    example: 'K02.1',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  code?: string | null;

  @ApiProperty({
    description: 'Descripción clínica del diagnóstico',
    example: 'Caries de la dentina',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
