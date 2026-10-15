import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { MaterialRepositoryPort } from '../../domain/material.repository.port';
import { Material } from '../../domain/material.entity';
import { MaterialMapper } from '../mappers/material.mapper';
import { DuplicateMaterialCatalogError } from '../../domain/catalogs.errors';

@Injectable()
export class PrismaMaterialRepository implements MaterialRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<Material | null> {
    const record = await this.prisma.client.material.findFirst({
      where: {
        id,
        clinicId,
      },
    });

    return record ? MaterialMapper.toDomain(record) : null;
  }

  async findByNaturalKey(
    clinicId: string,
    brand: string,
    reference: string,
    color: string,
  ): Promise<Material | null> {
    const record = await this.prisma.client.material.findUnique({
      where: {
        clinicId_brand_reference_color: {
          clinicId,
          brand: brand.trim(),
          reference: reference.trim(),
          color: color.trim(),
        },
      },
    });

    return record ? MaterialMapper.toDomain(record) : null;
  }

  async findAllByClinicId(clinicId: string, includeInactive = false): Promise<Material[]> {
    const records = await this.prisma.client.material.findMany({
      where: {
        clinicId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { brand: 'asc' },
    });

    return records.map((record) => MaterialMapper.toDomain(record));
  }

  async save(material: Material): Promise<void> {
    const data = MaterialMapper.toPersistence(material);

    try {
      await this.prisma.client.material.upsert({
        where: { id: material.id },
        create: data,
        update: data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateMaterialCatalogError(material.brand, material.reference, material.color);
      }
      throw error;
    }
  }
}
