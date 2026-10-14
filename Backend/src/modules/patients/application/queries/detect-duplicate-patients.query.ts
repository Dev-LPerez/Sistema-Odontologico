import { Injectable, Inject } from '@nestjs/common';
import {
  PatientRepositoryPort,
  PATIENT_REPOSITORY_TOKEN,
} from '../../domain/patient.repository.port';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { DocumentType } from '../../domain/document-type.enum';
import { PatientResult } from '../use-cases/create-patient.use-case';

export interface DetectDuplicatePatientsParams {
  clinicId: string;
  documentNumber?: string;
  phone?: string;
  excludePatientId?: string;
}

export interface DuplicatePatientResult extends PatientResult {
  matchReason: 'DOCUMENT' | 'PHONE' | 'BOTH';
}

@Injectable()
export class DetectDuplicatePatientsQuery {
  constructor(
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepo: PatientRepositoryPort,
  ) {}

  async execute(params: DetectDuplicatePatientsParams): Promise<DuplicatePatientResult[]> {
    const normalizedDoc = params.documentNumber
      ? DocumentIdentity.create(DocumentType.OTHER, params.documentNumber).number
      : undefined;

    const normalizedPhone = params.phone ? PhoneNumber.create(params.phone).value : undefined;

    if (!normalizedDoc && !normalizedPhone) {
      return [];
    }

    const matchedPatients = await this.patientRepo.findPotentialDuplicates(params.clinicId, {
      documentNumber: normalizedDoc,
      phone: normalizedPhone,
      excludePatientId: params.excludePatientId,
    });

    return matchedPatients.map((patient) => {
      const isDocMatch = normalizedDoc !== undefined && patient.document.number === normalizedDoc;
      const isPhoneMatch = normalizedPhone !== undefined && patient.phone.value === normalizedPhone;

      let matchReason: 'DOCUMENT' | 'PHONE' | 'BOTH' = 'DOCUMENT';
      if (isDocMatch && isPhoneMatch) {
        matchReason = 'BOTH';
      } else if (isPhoneMatch) {
        matchReason = 'PHONE';
      }

      return {
        id: patient.id,
        clinicId: patient.clinicId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        documentType: patient.document.type,
        documentNumber: patient.document.number,
        birthDate: patient.birthDate,
        phone: patient.phone.value,
        email: patient.email,
        address: patient.address,
        emergencyContactName: patient.emergencyContact?.name ?? null,
        emergencyContactPhone: patient.emergencyContact?.phone.value ?? null,
        acquisitionSource: patient.acquisitionSource,
        dataTreatmentConsent: patient.dataTreatmentConsent,
        dataTreatmentConsentAt: patient.dataTreatmentConsentAt,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        matchReason,
      };
    });
  }
}
