import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';

export class SetPatientProcedurePriceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  @IsNotEmpty()
  procedureId!: string;

  @ApiProperty({
    example: 140000,
    description: 'Precio personalizado en pesos colombianos (COP)',
  })
  @IsInt()
  @Min(0)
  customPriceCop!: number;

  @ApiProperty({ example: 'Tarifa familiar por recomendación' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}

export class ListPatientProcedurePricesQueryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;
}

export class PatientProcedurePriceResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  id!: string;

  @ApiProperty({ example: 'clinic-123' })
  clinicId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  patientId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  procedureId!: string;

  @ApiProperty({ example: 140000 })
  customPriceCop!: number;

  @ApiProperty({ example: 'Tarifa familiar' })
  reason!: string;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  updatedAt!: Date;

  static fromDomain(entity: PatientProcedurePrice): PatientProcedurePriceResponseDto {
    return {
      id: entity.id,
      clinicId: entity.clinicId,
      patientId: entity.patientId,
      procedureId: entity.procedureId,
      customPriceCop: entity.customPrice.amount,
      reason: entity.reason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
