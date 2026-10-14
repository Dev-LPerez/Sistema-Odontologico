import { Injectable, Inject } from '@nestjs/common';
import {
  PatientRepositoryPort,
  PATIENT_REPOSITORY_TOKEN,
} from '../../domain/patient.repository.port';
import { PatientResult } from '../use-cases/create-patient.use-case';

export interface ListPatientsParams {
  clinicId: string;
  isActive?: boolean;
}

@Injectable()
export class ListPatientsQuery {
  constructor(
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepo: PatientRepositoryPort,
  ) {}

  async execute(params: ListPatientsParams): Promise<PatientResult[]> {
    const filter = params.isActive !== undefined ? { isActive: params.isActive } : undefined;
    const patients = await this.patientRepo.findAllByClinicId(params.clinicId, filter);

    return patients.map((patient) => ({
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
    }));
  }
}
