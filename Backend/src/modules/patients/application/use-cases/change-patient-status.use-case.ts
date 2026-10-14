import { Injectable, Inject } from '@nestjs/common';
import {
  PatientRepositoryPort,
  PATIENT_REPOSITORY_TOKEN,
} from '../../domain/patient.repository.port';
import { PatientNotFoundError } from '../../domain/patients.errors';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';
import { PatientResult } from './create-patient.use-case';

export interface ChangePatientStatusCommand {
  clinicId: string;
  patientId: string;
  isActive: boolean;
}

@Injectable()
export class ChangePatientStatusUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepo: PatientRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: ChangePatientStatusCommand): Promise<PatientResult> {
    const patient = await this.patientRepo.findById(command.clinicId, command.patientId);

    if (!patient) {
      throw new PatientNotFoundError(command.patientId);
    }

    const now = this.clock.now();
    patient.changeStatus(command.isActive, now);

    await this.patientRepo.save(patient);

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
