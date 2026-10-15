import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Material } from '../../domain/material.entity';

export class CreateMaterialDto {
  @ApiProperty({ example: '3M' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand!: string;

  @ApiProperty({ example: 'Filtek Z350' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reference!: string;

  @ApiProperty({ example: 'RESIN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type!: string;

  @ApiProperty({ example: 'A2' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  color!: string;

  @ApiProperty({ example: 10, description: 'Existencia física actual' })
  @IsInt()
  @Min(0)
  currentStock!: number;

  @ApiProperty({ example: 2, description: 'Umbral mínimo de inventario para alerta' })
  @IsInt()
  @Min(0)
  minStock!: number;
}

export class UpdateMaterialDto {
  @ApiPropertyOptional({ example: '3M ESPE' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'Filtek Z350 XT' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ example: 'RESIN' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({ example: 'A3' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ConsumeMaterialStockDto {
  @ApiProperty({ example: 2, description: 'Cantidad a descontar del inventario' })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ListMaterialsQueryDto {
  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}

export class MaterialResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440004' })
  id!: string;

  @ApiProperty({ example: 'clinic-123' })
  clinicId!: string;

  @ApiProperty({ example: '3M' })
  brand!: string;

  @ApiProperty({ example: 'Filtek Z350' })
  reference!: string;

  @ApiProperty({ example: 'RESIN' })
  type!: string;

  @ApiProperty({ example: 'A2' })
  color!: string;

  @ApiProperty({ example: 10 })
  currentStock!: number;

  @ApiProperty({ example: 2 })
  minStock!: number;

  @ApiProperty({ example: false, description: 'True cuando currentStock <= minStock' })
  isLowStock!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  updatedAt!: Date;

  static fromDomain(entity: Material): MaterialResponseDto {
    return {
      id: entity.id,
      clinicId: entity.clinicId,
      brand: entity.brand,
      reference: entity.reference,
      type: entity.type,
      color: entity.color,
      currentStock: entity.currentStock,
      minStock: entity.minStock,
      isLowStock: entity.isLowStock,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
