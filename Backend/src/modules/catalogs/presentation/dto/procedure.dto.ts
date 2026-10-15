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
import { Procedure } from '../../domain/procedure.entity';

export class CreateProcedureDto {
  @ApiProperty({ example: 'RES-EST' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Resina estética' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Restauración en resina fotocurable',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ example: 180000, description: 'Precio base estándar en pesos colombianos (COP)' })
  @IsInt()
  @Min(0)
  basePriceCop!: number;
}

export class UpdateProcedureDto {
  @ApiPropertyOptional({ example: 'Resina estética posterior' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Descripción actualizada',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePriceCop?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListProceduresQueryDto {
  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}

export class ProcedureResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'clinic-123' })
  clinicId!: string;

  @ApiProperty({ example: 'RES-EST' })
  code!: string;

  @ApiProperty({ example: 'Resina estética' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ example: 180000 })
  basePriceCop!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  updatedAt!: Date;

  static fromDomain(entity: Procedure): ProcedureResponseDto {
    return {
      id: entity.id,
      clinicId: entity.clinicId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      basePriceCop: entity.basePrice.amount,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
