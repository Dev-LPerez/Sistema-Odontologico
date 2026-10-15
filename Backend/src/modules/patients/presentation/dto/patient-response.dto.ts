import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';

export class PatientResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'clinic-123' })
  clinicId!: string;

  @ApiProperty({ example: 'Carlos' })
  firstName!: string;

  @ApiProperty({ example: 'Gómez' })
  lastName!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC })
  documentType!: DocumentType;

  @ApiProperty({ example: '1020304050' })
  documentNumber!: string;

  @ApiProperty({ example: '1990-05-15T00:00:00.000Z' })
  birthDate!: Date;

  @ApiProperty({ example: '3001234567' })
  phone!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'carlos@example.com' })
  email!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Calle 100 # 15-20' })
  address!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'María Gómez' })
  emergencyContactName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '3109876543' })
  emergencyContactPhone!: string | null;

  @ApiProperty({ enum: AcquisitionSource, example: AcquisitionSource.INSTAGRAM })
  acquisitionSource!: AcquisitionSource;

  @ApiProperty({ example: true })
  dataTreatmentConsent!: boolean;

  @ApiProperty({ example: '2026-10-14T10:00:00.000Z' })
  dataTreatmentConsentAt!: Date;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-10-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-14T10:00:00.000Z' })
  updatedAt!: Date;
}

export class DuplicatePatientResponseDto extends PatientResponseDto {
  @ApiProperty({
    enum: ['DOCUMENT', 'PHONE', 'BOTH'],
    example: 'PHONE',
    description: 'Motivo por el cual se detectó la coincidencia',
  })
  matchReason!: 'DOCUMENT' | 'PHONE' | 'BOTH';
}

export class PatientSearchResponseDto extends PatientResponseDto {
  @ApiPropertyOptional({
    example: 0.85,
    description: 'Puntuación de similitud calculada por trigramas',
  })
  similarityScore?: number;
}
