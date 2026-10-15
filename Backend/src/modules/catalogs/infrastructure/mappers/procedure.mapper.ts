import { Procedure as PrismaProcedure, Prisma } from '@prisma/client';
import { Procedure } from '../../domain/procedure.entity';
import { Money } from '../../domain/money.vo';

export class ProcedureMapper {
  static toDomain(raw: PrismaProcedure): Procedure {
    return Procedure.create({
      id: raw.id,
      clinicId: raw.clinicId,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      basePrice: Money.from(raw.basePriceCop),
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(domain: Procedure): Prisma.ProcedureUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      code: domain.code,
      name: domain.name,
      description: domain.description,
      basePriceCop: domain.basePrice.amount,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
