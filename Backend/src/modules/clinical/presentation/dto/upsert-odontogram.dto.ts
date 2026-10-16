import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';

export class ToothFindingItemDto {
  @ApiProperty({ description: 'Número de diente FDI (11..48 o 51..85)', example: 16 })
  @IsInt()
  @IsNotEmpty()
  toothNumber!: number;

  @ApiProperty({
    enum: ToothSurface,
    description: 'Superficie dental afectada',
    example: ToothSurface.OCCLUSAL,
  })
  @IsEnum(ToothSurface)
  @IsNotEmpty()
  surface!: ToothSurface;

  @ApiProperty({
    enum: FindingCatalogCode,
    description: 'Código del catálogo de hallazgos',
    example: FindingCatalogCode.CARIES,
  })
  @IsEnum(FindingCatalogCode)
  @IsNotEmpty()
  findingCode!: FindingCatalogCode;

  @ApiProperty({
    enum: FindingStatus,
    description: 'Estado del hallazgo',
    example: FindingStatus.EXISTING,
  })
  @IsEnum(FindingStatus)
  @IsNotEmpty()
  status!: FindingStatus;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Notas u observaciones del hallazgo',
    example: 'Fosa oclusal profunda',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpsertOdontogramDto {
  @ApiPropertyOptional({
    description: 'Indica si se habilita la dentición temporal (dientes 51..85)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasTemporalDentition?: boolean;

  @ApiProperty({
    type: [ToothFindingItemDto],
    description: 'Lista de hallazgos del odontograma',
  })
  @ValidateNested({ each: true })
  @Type(() => ToothFindingItemDto)
  findings!: ToothFindingItemDto[];
}
