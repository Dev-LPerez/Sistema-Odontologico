import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: 'Carlos Alberto' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Gómez Pérez' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '3009998877' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'carlos.alberto@example.com' })
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Carrera 7 # 120-10' })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Pedro Gómez' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '3201112233' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string | null;

  @ApiPropertyOptional({
    enum: AcquisitionSource,
    example: AcquisitionSource.INSTAGRAM,
  })
  @IsOptional()
  @IsEnum(AcquisitionSource)
  acquisitionSource?: AcquisitionSource;
}
