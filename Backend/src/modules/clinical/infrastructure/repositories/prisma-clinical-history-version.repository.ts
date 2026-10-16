import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ClinicalHistoryVersionRepositoryPort } from '../../domain/clinical-history-version.repository.port';
import { ClinicalHistoryVersion } from '../../domain/clinical-history-version.entity';
import { DuplicateClinicalHistoryVersionError } from '../../domain/clinical.errors';
import { ClinicalHistoryMapper } from '../mappers/clinical-history.mapper';

@Injectable()
export class PrismaClinicalHistoryVersionRepository implements ClinicalHistoryVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByHistoryId(clinicId: string, historyId: string): Promise<ClinicalHistoryVersion[]> {
    const records = await this.prisma.client.clinicalHistoryVersion.findMany({
      where: {
        clinicId,
        clinicalHistoryId: historyId,
      },
      orderBy: {
        versionNumber: 'asc',
      },
    });

    return records.map((record) => ClinicalHistoryMapper.versionToDomain(record));
  }

  async save(version: ClinicalHistoryVersion): Promise<void> {
    const data = ClinicalHistoryMapper.versionToPrisma(version);

    try {
      await this.prisma.client.clinicalHistoryVersion.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateClinicalHistoryVersionError(
          version.clinicalHistoryId,
          version.versionNumber,
        );
      }
      throw error;
    }
  }
}
