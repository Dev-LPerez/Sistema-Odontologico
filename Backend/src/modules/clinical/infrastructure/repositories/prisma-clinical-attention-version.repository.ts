import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ClinicalAttentionVersionRepositoryPort } from '../../domain/clinical-attention-version.repository.port';
import { ClinicalAttentionVersion } from '../../domain/clinical-attention-version.entity';
import { DuplicateClinicalAttentionVersionError } from '../../domain/clinical.errors';
import { ClinicalAttentionMapper } from '../mappers/clinical-attention.mapper';

@Injectable()
export class PrismaClinicalAttentionVersionRepository implements ClinicalAttentionVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByAttentionId(
    clinicId: string,
    attentionId: string,
  ): Promise<ClinicalAttentionVersion[]> {
    const records = await this.prisma.client.clinicalAttentionVersion.findMany({
      where: {
        clinicId,
        attentionId,
      },
      orderBy: {
        versionNumber: 'asc',
      },
    });

    return records.map((record) => ClinicalAttentionMapper.versionToDomain(record));
  }

  async save(version: ClinicalAttentionVersion): Promise<void> {
    const data = ClinicalAttentionMapper.versionToPrisma(version);

    try {
      await this.prisma.client.clinicalAttentionVersion.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateClinicalAttentionVersionError(
          version.attentionId,
          version.versionNumber,
        );
      }
      throw error;
    }
  }
}
