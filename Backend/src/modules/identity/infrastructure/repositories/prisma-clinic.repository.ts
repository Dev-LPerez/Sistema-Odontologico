import { Injectable } from '@nestjs/common';
import { ClinicRepositoryPort } from '../../domain/clinic.repository.port';
import { Clinic } from '../../domain/clinic.entity';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ClinicMapper } from '../mappers/clinic.mapper';

@Injectable()
export class PrismaClinicRepository implements ClinicRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Clinic | null> {
    const raw = await this.prisma.client.clinic.findUnique({
      where: { id },
    });
    return raw ? ClinicMapper.toDomain(raw) : null;
  }

  async save(clinic: Clinic): Promise<void> {
    const data = ClinicMapper.toPersistence(clinic);
    await this.prisma.client.clinic.upsert({
      where: { id: clinic.id },
      create: data,
      update: data,
    });
  }
}
