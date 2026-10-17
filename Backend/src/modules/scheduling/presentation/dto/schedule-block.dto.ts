import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateScheduleBlockDto {
  @ApiProperty({
    description: 'Fecha y hora de inicio en formato ISO8601',
    example: '2026-12-20T00:00:00.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({
    description: 'Fecha y hora de fin en formato ISO8601',
    example: '2026-12-25T23:59:59.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({
    description: 'Motivo del bloqueo temporal',
    example: 'Vacaciones de fin de año',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}

export class ListScheduleBlocksQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar bloqueos activos a partir de esta fecha ISO8601',
    example: '2026-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;
}

export class ScheduleBlockResponseDto {
  @ApiProperty({ example: 'block-uuid' })
  id!: string;

  @ApiProperty({ example: 'clinic-uuid' })
  clinicId!: string;

  @ApiProperty({ example: '2026-12-20T00:00:00.000Z' })
  startDate!: string;

  @ApiProperty({ example: '2026-12-25T23:59:59.000Z' })
  endDate!: string;

  @ApiProperty({ example: 'Vacaciones de fin de año' })
  reason!: string;

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z' })
  updatedAt!: string;
}
