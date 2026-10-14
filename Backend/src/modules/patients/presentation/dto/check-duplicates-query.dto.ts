import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckDuplicatesQueryDto {
  @ApiPropertyOptional({ example: '1020304050' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de paciente a excluir durante edición',
  })
  @IsOptional()
  @IsString()
  excludePatientId?: string;
}
