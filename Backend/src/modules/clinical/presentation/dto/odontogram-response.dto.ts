import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';
import { Odontogram } from '../../domain/odontogram.entity';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';

export class ToothFindingResponseDto {
  @ApiProperty({ description: 'Número de diente FDI', example: 16 })
  toothNumber!: number;

  @ApiProperty({
    enum: ToothSurface,
    description: 'Superficie dental',
    example: ToothSurface.OCCLUSAL,
  })
  surface!: ToothSurface;

  @ApiProperty({
    enum: FindingCatalogCode,
    description: 'Código del catálogo',
    example: FindingCatalogCode.CARIES,
  })
  findingCode!: FindingCatalogCode;

  @ApiProperty({
    enum: FindingStatus,
    description: 'Estado',
    example: FindingStatus.EXISTING,
  })
  status!: FindingStatus;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Notas',
    example: 'Fosa distal',
  })
  notes!: string | null;

  @ApiProperty({ description: 'Fecha de registro en ISO' })
  createdAt!: string;
}

export class OdontogramResponseDto {
  @ApiProperty({ example: 'odon-123' })
  id!: string;

  @ApiProperty({ example: 'clinic-123' })
  clinicId!: string;

  @ApiProperty({ example: 'patient-456' })
  patientId!: string;

  @ApiProperty({ example: false })
  hasTemporalDentition!: boolean;

  @ApiProperty({
    description: 'Estructura JSON indexada por número de diente FDI',
    type: 'object',
    additionalProperties: true,
  })
  teethState!: Record<string, unknown>;

  @ApiProperty({ type: [ToothFindingResponseDto] })
  findings!: ToothFindingResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromDomain(entity: Odontogram): OdontogramResponseDto {
    const structured = entity.toStructuredJson();
    return {
      id: entity.id,
      clinicId: entity.clinicId,
      patientId: entity.patientId,
      hasTemporalDentition: entity.hasTemporalDentition,
      teethState: structured.teeth,
      findings: entity.findings.map((f) => ({
        toothNumber: f.toothNumber.value,
        surface: f.surface,
        findingCode: f.findingCode,
        status: f.status,
        notes: f.notes,
        createdAt: f.createdAt.toISOString(),
      })),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

export class OdontogramSnapshotResponseDto {
  @ApiProperty({ example: 'snap-123' })
  id!: string;

  @ApiProperty({ example: 'clinic-123' })
  clinicId!: string;

  @ApiProperty({ example: 'patient-456' })
  patientId!: string;

  @ApiProperty({ example: 'odon-123' })
  odontogramId!: string;

  @ApiProperty({ example: false })
  hasTemporalDentition!: boolean;

  @ApiProperty({
    description: 'Datos históricos inmutables de la instantánea',
    type: 'object',
    additionalProperties: true,
  })
  snapshotData!: Record<string, unknown>;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Instantánea inicial',
  })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  static fromDomain(entity: OdontogramSnapshot): OdontogramSnapshotResponseDto {
    return {
      id: entity.id,
      clinicId: entity.clinicId,
      patientId: entity.patientId,
      odontogramId: entity.odontogramId,
      hasTemporalDentition: entity.hasTemporalDentition,
      snapshotData: entity.snapshotData,
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
