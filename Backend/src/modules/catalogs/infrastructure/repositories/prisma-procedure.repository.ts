import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ProcedureRepositoryPort } from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';
import { ProcedureMapper } from '../mappers/procedure.mapper';
import { DuplicateProcedureCodeError } from '../../domain/catalogs.errors';

@Injectable()
export class PrismaProcedureRepository implements ProcedureRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<Procedure | null> {
    const record = await this.prisma.client.procedure.findFirst({
      where: {
        id,
        clinicId,
      },
    });

    return record ? ProcedureMapper.toDomain(record) : null;
  }

  async findByCode(clinicId: string, code: string): Promise<Procedure | null> {
    const normalizedCode = Procedure.normalizeCode(code);
    const record = await this.prisma.client.procedure.findUnique({
      where: {
        clinicId_code: {
          clinicId,
          code: normalizedCode,
        },
      },
    });

    return record ? ProcedureMapper.toDomain(record) : null;
  }

  async findAllByClinicId(clinicId: string, includeInactive = false): Promise<Procedure[]> {
    const records = await this.prisma.client.procedure.findMany({
      where: {
        clinicId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    return records.map((record) => ProcedureMapper.toDomain(record));
  }

  async save(procedure: Procedure): Promise<void> {
    const data = ProcedureMapper.toPersistence(procedure);

    try {
      await this.prisma.client.procedure.upsert({
        where: { id: procedure.id },
        create: data,
        update: data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateProcedureCodeError(procedure.code);
      }
      throw error;
    }
  }
}
