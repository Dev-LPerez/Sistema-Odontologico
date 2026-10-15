import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  PatientQueriesPort,
  SearchPatientsByTrigramParams,
  PatientSearchItemDto,
} from '../../application/ports/patient.queries.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';

interface RawPatientSearchResult {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: Date | string;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  acquisitionSource: string;
  dataTreatmentConsent: boolean;
  dataTreatmentConsentAt: Date | string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  similarityScore?: number | string | null;
}

@Injectable()
export class PrismaPatientQueriesAdapter implements PatientQueriesPort {
  constructor(private readonly prisma: PrismaService) {}

  async searchByTrigram(params: SearchPatientsByTrigramParams): Promise<PatientSearchItemDto[]> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const query = params.query.trim();
    const digits = params.normalizedDigits ?? '';
    const hasDigits = digits.length > 0;
    const clinicId = params.clinicId;
    const activeFilter = params.includeInactive ? Prisma.empty : Prisma.sql`AND p.is_active = true`;
    const digitPattern = `%${digits}%`;

    const sql = Prisma.sql`
      SELECT
        p.id,
        p.clinic_id AS "clinicId",
        p.first_name AS "firstName",
        p.last_name AS "lastName",
        p.document_type AS "documentType",
        p.document_number AS "documentNumber",
        p.birth_date AS "birthDate",
        p.phone,
        p.email,
        p.address,
        p.emergency_contact_name AS "emergencyContactName",
        p.emergency_contact_phone AS "emergencyContactPhone",
        p.acquisition_source AS "acquisitionSource",
        p.data_treatment_consent AS "dataTreatmentConsent",
        p.data_treatment_consent_at AS "dataTreatmentConsentAt",
        p.is_active AS "isActive",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        GREATEST(
          similarity(immutable_unaccent(p.first_name || ' ' || p.last_name), immutable_unaccent(${query})),
          word_similarity(immutable_unaccent(${query}), immutable_unaccent(p.first_name || ' ' || p.last_name)),
          CASE WHEN immutable_unaccent(p.first_name || ' ' || p.last_name) ILIKE ('%' || immutable_unaccent(${query}) || '%') THEN 0.6 ELSE 0.0 END,
          ${
            hasDigits
              ? Prisma.sql`CASE WHEN p.document_number ILIKE ${digitPattern} OR p.phone ILIKE ${digitPattern} THEN 0.8 ELSE 0.0 END`
              : Prisma.sql`0.0`
          }
        ) AS "similarityScore"
      FROM patients p
      WHERE p.clinic_id = ${clinicId}
        ${activeFilter}
        AND (
          immutable_unaccent(p.first_name || ' ' || p.last_name) % immutable_unaccent(${query})
          OR immutable_unaccent(p.first_name || ' ' || p.last_name) %> immutable_unaccent(${query})
          OR immutable_unaccent(p.first_name || ' ' || p.last_name) ILIKE ('%' || immutable_unaccent(${query}) || '%')
          ${
            hasDigits
              ? Prisma.sql`OR p.document_number ILIKE ${digitPattern} OR p.phone ILIKE ${digitPattern}`
              : Prisma.empty
          }
        )
      ORDER BY "similarityScore" DESC, p.created_at DESC
      LIMIT ${limit}
    `;

    const rawRows = await this.prisma.client.$queryRaw<RawPatientSearchResult[]>(sql);

    return rawRows.map((row) => this.mapRawToDto(row));
  }

  private mapRawToDto(raw: RawPatientSearchResult): PatientSearchItemDto {
    const rawScore = raw.similarityScore;
    const similarityScore =
      rawScore !== undefined && rawScore !== null ? Number(rawScore) : undefined;

    return {
      id: raw.id,
      clinicId: raw.clinicId,
      firstName: raw.firstName,
      lastName: raw.lastName,
      documentType: raw.documentType as DocumentType,
      documentNumber: raw.documentNumber,
      birthDate: new Date(raw.birthDate),
      phone: raw.phone,
      email: raw.email ?? null,
      address: raw.address ?? null,
      emergencyContactName: raw.emergencyContactName ?? null,
      emergencyContactPhone: raw.emergencyContactPhone ?? null,
      acquisitionSource: (raw.acquisitionSource as AcquisitionSource) || AcquisitionSource.DIRECT,
      dataTreatmentConsent: Boolean(raw.dataTreatmentConsent),
      dataTreatmentConsentAt: new Date(raw.dataTreatmentConsentAt),
      isActive: Boolean(raw.isActive),
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
      similarityScore,
    };
  }
}
