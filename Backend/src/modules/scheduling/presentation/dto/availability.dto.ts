import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class AvailabilitySlotDto {
  @ApiProperty({
    description: 'Día de la semana: 1 (Lunes) a 7 (Domingo)',
    example: 1,
    minimum: 1,
    maximum: 7,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Hora de inicio en formato HH:MM (mínimo 09:00)', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime debe tener formato HH:MM',
  })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin en formato HH:MM', example: '18:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime debe tener formato HH:MM',
  })
  endTime!: string;
}

export class ConfigureAvailabilityDto {
  @ApiProperty({ type: [AvailabilitySlotDto], description: 'Franjas semanales de atención' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];

  @ApiPropertyOptional({
    description: 'Tope máximo de citas por jornada (1 a 10)',
    example: 4,
    default: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxDailyAppointments?: number;
}

export class AvailabilityResponseDto {
  @ApiProperty({ example: 'clinic-uuid' })
  clinicId!: string;

  @ApiProperty({ example: 4 })
  maxDailyAppointments!: number;

  @ApiProperty({ type: [AvailabilitySlotDto] })
  slots!: AvailabilitySlotDto[];

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z' })
  updatedAt!: string;
}
