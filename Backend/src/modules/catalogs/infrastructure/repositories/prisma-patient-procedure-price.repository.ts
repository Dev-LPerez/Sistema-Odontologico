import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PatientProcedurePriceRepositoryPort } from '../../domain/patient-procedure-price.repository.port';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';
import { PatientProcedurePriceMapper } from '../mappers/patient-procedure-price.mapper';

@Injectable()
export class PrismaPatientProcedurePriceRepository implements PatientProcedurePriceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatientAndProcedure(
    clinicId: string,
    patientId: string,
    procedureId: string,
  ): Promise<PatientProcedurePrice | null> {
    const record = await this.prisma.client.patientProcedurePrice.findUnique({
      where: {
        clinicId_patientId_procedureId: {
          clinicId,
          patientId,
          procedureId,
        },
      },
    });

    return record ? PatientProcedurePriceMapper.toDomain(record) : null;
  }

  async findAllByPatient(clinicId: string, patientId: string): Promise<PatientProcedurePrice[]> {
    const records = await this.prisma.client.patientProcedurePrice.findMany({
      where: {
        clinicId,
        patientId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => PatientProcedurePriceMapper.toDomain(record));
  }

  async save(price: PatientProcedurePrice): Promise<void> {
    const data = PatientProcedurePriceMapper.toPersistence(price);

    await this.prisma.client.patientProcedurePrice.upsert({
      where: {
        clinicId_patientId_procedureId: {
          clinicId: price.clinicId,
          patientId: price.patientId,
          procedureId: price.procedureId,
        },
      },
      create: data,
      update: {
        customPriceCop: data.customPriceCop,
        reason: data.reason,
        updatedAt: data.updatedAt,
      },
    });
  }
}
