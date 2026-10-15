import { Material as PrismaMaterial, Prisma } from '@prisma/client';
import { Material } from '../../domain/material.entity';

export class MaterialMapper {
  static toDomain(raw: PrismaMaterial): Material {
    return Material.create({
      id: raw.id,
      clinicId: raw.clinicId,
      brand: raw.brand,
      reference: raw.reference,
      type: raw.type,
      color: raw.color,
      currentStock: raw.currentStock,
      minStock: raw.minStock,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(domain: Material): Prisma.MaterialUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      brand: domain.brand,
      reference: domain.reference,
      type: domain.type,
      color: domain.color,
      currentStock: domain.currentStock,
      minStock: domain.minStock,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
