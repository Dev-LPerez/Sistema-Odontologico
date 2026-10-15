import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddTreatmentPlanItemDto {
  @ApiProperty({
    description: 'ID del procedimiento en el catálogo',
    example: 'd3b07384-d113-494b-9c8e-aa6725345759',
  })
  @IsUUID()
  procedureId!: string;

  @ApiPropertyOptional({
    description: 'Número de diente (FDI)',
    example: '16',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  toothNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Costo estimado manual en COP (si no se proporciona se resuelve del catálogo)',
    example: 150000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedCostCop?: number;

  @ApiPropertyOptional({
    description: 'Notas o indicaciones del procedimiento',
    example: 'Aislamiento absoluto requerido',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
