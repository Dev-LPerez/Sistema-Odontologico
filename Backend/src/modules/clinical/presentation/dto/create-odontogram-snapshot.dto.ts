import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateOdontogramSnapshotDto {
  @ApiPropertyOptional({
    description: 'Notas u observaciones clínicas de la instantánea',
    example: 'Instantánea de evolución tras obturación',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
