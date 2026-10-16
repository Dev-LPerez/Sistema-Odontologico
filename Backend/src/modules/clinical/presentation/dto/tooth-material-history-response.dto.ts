import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ToothMaterialHistoryResponseDto {
  @ApiProperty({
    description: 'ID de la atención clínica',
    example: 'd4444444-4444-4444-8444-444444444444',
  })
  attentionId!: string;

  @ApiProperty({
    description: 'Fecha y hora de la atención en formato ISO 8601',
    example: '2026-10-16T10:00:00.000Z',
  })
  attendedAt!: string;

  @ApiProperty({
    description: 'ID del material utilizado',
    example: 'm-resina-3m',
  })
  materialId!: string;

  @ApiProperty({
    description: 'Marca del material utilizado',
    example: '3M',
  })
  brand!: string;

  @ApiProperty({
    description: 'Referencia comercial del material',
    example: 'Filtek Z350 XT',
  })
  reference!: string;

  @ApiProperty({
    description: 'Tipo o clasificación del material',
    example: 'Resina compuesta',
  })
  type!: string;

  @ApiProperty({
    description: 'Color o tono del material',
    example: 'A2',
  })
  color!: string;

  @ApiProperty({
    description: 'Número del diente tratado según nomenclatura FDI',
    example: '16',
  })
  toothNumber!: string;

  @ApiProperty({
    description: 'Cantidad de unidades consumidas',
    example: 1,
  })
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales del uso del material',
    example: 'Restauración en cara oclusal con aislamiento absoluto',
    type: String,
    nullable: true,
  })
  notes!: string | null;
}
