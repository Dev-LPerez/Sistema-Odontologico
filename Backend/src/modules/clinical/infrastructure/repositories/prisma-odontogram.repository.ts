import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { OdontogramRepositoryPort } from '../../domain/odontogram.repository.port';
import { Odontogram } from '../../domain/odontogram.entity';
import { OdontogramMapper } from '../mappers/odontogram.mapper';
import { DuplicateOdontogramError } from '../../domain/clinical.errors';

@Injectable()
export class PrismaOdontogramRepository implements OdontogramRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatientId(clinicId: string, patientId: string): Promise<Odontogram | null> {
    const record = await this.prisma.client.odontogram.findFirst({
      where: {
        clinicId,
        patientId,
      },
    });

    return record ? OdontogramMapper.toDomain(record) : null;
  }

  async save(odontogram: Odontogram): Promise<void> {
    const data = OdontogramMapper.toPrisma(odontogram);

    try {
      await this.prisma.client.odontogram.upsert({
        where: { id: data.id },
        create: data,
        update: {
          hasTemporalDentition: data.hasTemporalDentition,
          teethState: data.teethState,
          updatedAt: data.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateOdontogramError(odontogram.patientId);
      }
      throw error;
    }
  }
}
