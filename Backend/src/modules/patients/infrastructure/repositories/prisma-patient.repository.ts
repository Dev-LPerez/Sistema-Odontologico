import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  PatientRepositoryPort,
  FindPotentialDuplicatesParams,
} from '../../domain/patient.repository.port';
import { Patient } from '../../domain/patient.entity';
import { DocumentType } from '../../domain/document-type.enum';
import { PatientMapper } from '../mappers/patient.mapper';
import { DocumentType as PrismaDocumentType, Prisma } from '@prisma/client';
import { DuplicatePatientDocumentError } from '../../domain/patients.errors';

@Injectable()
export class PrismaPatientRepository implements PatientRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<Patient | null> {
    const record = await this.prisma.client.patient.findFirst({
      where: {
        id,
        clinicId,
      },
    });

    return record ? PatientMapper.toDomain(record) : null;
  }

  async findByDocument(
    clinicId: string,
    documentType: DocumentType,
    documentNumber: string,
  ): Promise<Patient | null> {
    const record = await this.prisma.client.patient.findUnique({
      where: {
        clinicId_documentType_documentNumber: {
          clinicId,
          documentType: documentType as unknown as PrismaDocumentType,
          documentNumber,
        },
      },
    });

    return record ? PatientMapper.toDomain(record) : null;
  }

  async findPotentialDuplicates(
    clinicId: string,
    params: FindPotentialDuplicatesParams,
  ): Promise<Patient[]> {
    const orConditions: Array<{ documentNumber?: string; phone?: string }> = [];

    if (params.documentNumber) {
      orConditions.push({ documentNumber: params.documentNumber });
    }
    if (params.phone) {
      orConditions.push({ phone: params.phone });
    }

    if (orConditions.length === 0) {
      return [];
    }

    const records = await this.prisma.client.patient.findMany({
      where: {
        clinicId,
        ...(params.excludePatientId ? { id: { not: params.excludePatientId } } : {}),
        OR: orConditions,
      },
    });

    return records.map((record) => PatientMapper.toDomain(record));
  }

  async findAllByClinicId(clinicId: string, filter?: { isActive?: boolean }): Promise<Patient[]> {
    const records = await this.prisma.client.patient.findMany({
      where: {
        clinicId,
        ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => PatientMapper.toDomain(record));
  }

  async save(patient: Patient): Promise<void> {
    const data = PatientMapper.toPersistence(patient);

    try {
      await this.prisma.client.patient.upsert({
        where: { id: patient.id },
        create: data,
        update: data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicatePatientDocumentError(patient.document.number);
      }
      throw error;
    }
  }
}
