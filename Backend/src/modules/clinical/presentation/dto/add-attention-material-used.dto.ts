import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddAttentionMaterialUsedDto {
  @ApiProperty({
    description: 'ID del material propio registrado en el catálogo',
    example: 'd3b07384-d113-494b-9c8e-aa6725345759',
  })
  @IsUUID()
  @IsNotEmpty()
  materialId!: string;

  @ApiProperty({
    description: 'Cantidad del material consumida en la atención (entero mayor a cero)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Número de diente FDI donde se aplicó el material (11-48, 51-85)',
    example: '16',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  toothNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Notas u observaciones sobre el uso del material',
    example: 'Restauración oclusal profunda con base cavitaria',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
