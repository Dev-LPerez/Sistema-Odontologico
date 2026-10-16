import {
  Odontogram as PrismaOdontogram,
  OdontogramSnapshot as PrismaOdontogramSnapshot,
  Prisma,
} from '@prisma/client';
import { Odontogram, StructuredOdontogramJson } from '../../domain/odontogram.entity';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';
import { ToothFinding, PlainToothFinding } from '../../domain/tooth-finding.vo';
import { ToothNumber } from '../../domain/tooth-number.vo';
import { ToothSurface } from '../../domain/tooth-surface.enum';
import { FindingCatalogCode } from '../../domain/finding-catalog.enum';
import { FindingStatus } from '../../domain/finding-status.enum';

export class OdontogramMapper {
  static toDomain(raw: PrismaOdontogram): Odontogram {
    const rawTeethState = (raw.teethState as unknown as StructuredOdontogramJson) || { teeth: {} };
    const findings: ToothFinding[] = [];

    if (rawTeethState.teeth && typeof rawTeethState.teeth === 'object') {
      for (const toothFindings of Object.values(rawTeethState.teeth)) {
        if (Array.isArray(toothFindings)) {
          for (const item of toothFindings as PlainToothFinding[]) {
            findings.push(
              ToothFinding.create({
                toothNumber: ToothNumber.of(item.toothNumber),
                surface: item.surface as ToothSurface,
                findingCode: item.findingCode as FindingCatalogCode,
                status: item.status as FindingStatus,
                notes: item.notes,
                createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
              }),
            );
          }
        }
      }
    }

    return Odontogram.create({
      id: raw.id,
      clinicId: raw.clinicId,
      patientId: raw.patientId,
      hasTemporalDentition: raw.hasTemporalDentition,
      findings,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(domain: Odontogram): Prisma.OdontogramUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      patientId: domain.patientId,
      hasTemporalDentition: domain.hasTemporalDentition,
      teethState: domain.toStructuredJson() as unknown as Prisma.InputJsonValue,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toSnapshotDomain(raw: PrismaOdontogramSnapshot): OdontogramSnapshot {
    return OdontogramSnapshot.create({
      id: raw.id,
      clinicId: raw.clinicId,
      patientId: raw.patientId,
      odontogramId: raw.odontogramId,
      hasTemporalDentition: raw.hasTemporalDentition,
      snapshotData: raw.snapshotData as Record<string, unknown>,
      notes: raw.notes,
      createdAt: raw.createdAt,
    });
  }

  static toSnapshotPrisma(
    domain: OdontogramSnapshot,
  ): Prisma.OdontogramSnapshotUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      patientId: domain.patientId,
      odontogramId: domain.odontogramId,
      hasTemporalDentition: domain.hasTemporalDentition,
      snapshotData: domain.snapshotData as unknown as Prisma.InputJsonValue,
      notes: domain.notes,
      createdAt: domain.createdAt,
    };
  }
}
