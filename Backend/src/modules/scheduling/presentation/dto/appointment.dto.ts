import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '../../domain/appointment-status.enum';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Identificador del paciente',
    example: 'd0b8f1c8-27b2-4d22-8d76-5fa4f9712a80',
  })
  @IsUUID('4')
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({
    description: 'Identificador del procedimiento',
    example: 'e1c9f2d9-38c3-4e33-9e87-6ab5f0823b91',
  })
  @IsUUID('4')
  @IsNotEmpty()
  procedureId!: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la cita en formato ISO8601',
    example: '2026-10-20T14:00:00.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({
    description: 'Duración en minutos (15 a 480)',
    example: 60,
    minimum: 15,
    maximum: 480,
  })
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes!: number;

  @ApiPropertyOptional({
    description: 'Notas opcionales de la cita',
    example: 'Primera consulta de valoración',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({
    description: 'Nueva fecha y hora de inicio en formato ISO8601',
    example: '2026-10-21T15:00:00.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  newStartTime!: string;

  @ApiPropertyOptional({
    description: 'Nueva duración en minutos (15 a 480)',
    example: 60,
    minimum: 15,
    maximum: 480,
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  newDurationMinutes?: number;
}

export class CancelAppointmentDto {
  @ApiProperty({
    description: 'Motivo obligatorio de cancelación de la cita',
    example: 'Paciente solicitó cancelar por viaje',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  cancellationReason!: string;
}

export class ChangeAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    description: 'Nuevo estado de la cita',
    example: AppointmentStatus.CONFIRMED,
  })
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status!: AppointmentStatus;
}

export class ListAppointmentsQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha inicio de rango de búsqueda ISO8601',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha fin de rango de búsqueda ISO8601',
    example: '2026-10-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por paciente',
    example: 'd0b8f1c8-27b2-4d22-8d76-5fa4f9712a80',
  })
  @IsOptional()
  @IsUUID('4')
  patientId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class AppointmentResponseDto {
  @ApiProperty({ example: 'appt-uuid' })
  id!: string;

  @ApiProperty({ example: 'clinic-uuid' })
  clinicId!: string;

  @ApiProperty({ example: 'patient-uuid' })
  patientId!: string;

  @ApiProperty({ example: 'procedure-uuid' })
  procedureId!: string;

  @ApiProperty({ example: '2026-10-20T14:00:00.000Z' })
  startTime!: string;

  @ApiProperty({ example: '2026-10-20T15:00:00.000Z' })
  endTime!: string;

  @ApiProperty({ example: 60 })
  durationMinutes!: number;

  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.SCHEDULED })
  status!: AppointmentStatus;

  @ApiPropertyOptional({ example: null })
  cancellationReason!: string | null;

  @ApiPropertyOptional({ example: 'Primera consulta' })
  notes!: string | null;

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z' })
  updatedAt!: string;
}
