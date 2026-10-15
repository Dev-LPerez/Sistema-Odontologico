import { PatientProcedurePrice as PrismaPatientProcedurePrice, Prisma } from '@prisma/client';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';
import { Money } from '../../domain/money.vo';

export class PatientProcedurePriceMapper {
  static toDomain(raw: PrismaPatientProcedurePrice): PatientProcedurePrice {
    return PatientProcedurePrice.create({
      id: raw.id,
      clinicId: raw.clinicId,
      patientId: raw.patientId,
      procedureId: raw.procedureId,
      customPrice: Money.from(raw.customPriceCop),
      reason: raw.reason,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(
    domain: PatientProcedurePrice,
  ): Prisma.PatientProcedurePriceUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      patientId: domain.patientId,
      procedureId: domain.procedureId,
      customPriceCop: domain.customPrice.amount,
      reason: domain.reason,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
