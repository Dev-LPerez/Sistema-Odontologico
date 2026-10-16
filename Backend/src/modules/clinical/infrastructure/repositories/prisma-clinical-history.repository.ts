import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { ClinicalHistoryMapper } from '../mappers/clinical-history.mapper';
import { DuplicateClinicalHistoryError } from '../../domain/clinical.errors';

@Injectable()
export class PrismaClinicalHistoryRepository implements ClinicalHistoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<ClinicalHistory | null> {
    const record = await this.prisma.client.clinicalHistory.findFirst({
      where: {
        id,
        clinicId,
      },
      include: {
        treatmentItems: true,
      },
    });

    return record ? ClinicalHistoryMapper.toDomain(record) : null;
  }

  async findByPatientId(clinicId: string, patientId: string): Promise<ClinicalHistory | null> {
    const record = await this.prisma.client.clinicalHistory.findFirst({
      where: {
        clinicId,
        patientId,
      },
      include: {
        treatmentItems: true,
      },
    });

    return record ? ClinicalHistoryMapper.toDomain(record) : null;
  }

  async save(clinicalHistory: ClinicalHistory): Promise<void> {
    const { header, items } = ClinicalHistoryMapper.toPrisma(clinicalHistory);

    const isInsideTransaction = this.prisma.client !== this.prisma;
    const run = async (tx: Prisma.TransactionClient | PrismaService) => {
      await tx.clinicalHistory.upsert({
        where: { id: header.id },
        create: header,
        update: {
          chiefComplaint: header.chiefComplaint,
          currentIllness: header.currentIllness,
          personalAntecedents: header.personalAntecedents,
          familyAntecedents: header.familyAntecedents,
          clinicalExamination: header.clinicalExamination,
          diagnoses: header.diagnoses,
          updatedAt: header.updatedAt,
        },
      });

      for (const item of items) {
        await tx.treatmentPlanItem.upsert({
          where: { id: item.id },
          create: item,
          update: {
            status: item.status,
            estimatedCostCop: item.estimatedCostCop,
            notes: item.notes,
            updatedAt: item.updatedAt,
          },
        });
      }
    };

    try {
      if (isInsideTransaction) {
        await run(this.prisma.client);
      } else {
        await this.prisma.$transaction(async (tx) => run(tx));
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateClinicalHistoryError(clinicalHistory.patientId);
      }
      throw error;
    }
  }
}
