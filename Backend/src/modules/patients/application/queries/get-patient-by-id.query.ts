import { Injectable, Inject } from '@nestjs/common';
import {
  PatientRepositoryPort,
  PATIENT_REPOSITORY_TOKEN,
} from '../../domain/patient.repository.port';
import { PatientNotFoundError } from '../../domain/patients.errors';
import { PatientResult } from '../use-cases/create-patient.use-case';

export interface GetPatientByIdParams {
  clinicId: string;
  patientId: string;
}

@Injectable()
export class GetPatientByIdQuery {
  constructor(
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepo: PatientRepositoryPort,
  ) {}

  async execute(params: GetPatientByIdParams): Promise<PatientResult> {
    const patient = await this.patientRepo.findById(params.clinicId, params.patientId);

    if (!patient) {
      throw new PatientNotFoundError(params.patientId);
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
    };
  }
}
