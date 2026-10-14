import { Clinic as PrismaClinic, Prisma } from '@prisma/client';
import { Clinic } from '../../domain/clinic.entity';

export class ClinicMapper {
  static toDomain(raw: PrismaClinic): Clinic {
    return Clinic.create({
      id: raw.id,
      name: raw.name,
      address: raw.address,
      phone: raw.phone,
      email: raw.email,
      logoUrl: raw.logoUrl,
      settings: (raw.settings as Record<string, unknown> | null) ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(domain: Clinic): Prisma.ClinicCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      address: domain.address,
      phone: domain.phone,
      email: domain.email,
      logoUrl: domain.logoUrl,
      settings: domain.settings ? (domain.settings as Prisma.InputJsonValue) : Prisma.JsonNull,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
