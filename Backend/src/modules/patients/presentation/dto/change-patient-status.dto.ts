import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ChangePatientStatusDto {
  @ApiProperty({ example: false, description: 'Estado activo o inactivo del paciente' })
  @IsBoolean()
  isActive!: boolean;
}
