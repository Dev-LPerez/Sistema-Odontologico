import { Injectable, Inject } from '@nestjs/common';
import {
  PatientRepositoryPort,
  PATIENT_REPOSITORY_TOKEN,
} from '../../domain/patient.repository.port';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { EmergencyContact } from '../../domain/emergency-contact.vo';
import { PatientNotFoundError } from '../../domain/patients.errors';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';
import { PatientResult } from './create-patient.use-case';

export interface UpdatePatientCommand {
  clinicId: string;
  patientId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  acquisitionSource?: AcquisitionSource;
}

@Injectable()
export class UpdatePatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepo: PatientRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  private buildEmergencyContact(
    name?: string | null,
    phone?: string | null,
  ): EmergencyContact | null | undefined {
    if (name && phone) {
      return EmergencyContact.create(name, PhoneNumber.create(phone));
    }
    if (name === null || phone === null) {
      return null;
    }
    return undefined;
  }

  async execute(command: UpdatePatientCommand): Promise<PatientResult> {
    const patient = await this.patientRepo.findById(command.clinicId, command.patientId);

    if (!patient) {
      throw new PatientNotFoundError(command.patientId);
    }

    const phone = command.phone ? PhoneNumber.create(command.phone) : undefined;
    const emergencyContact = this.buildEmergencyContact(
      command.emergencyContactName,
      command.emergencyContactPhone,
    );

    const now = this.clock.now();

    patient.updateDemographics({
      firstName: command.firstName,
      lastName: command.lastName,
      phone,
      email: command.email,
      address: command.address,
      emergencyContact,
      acquisitionSource: command.acquisitionSource,
      updatedAt: now,
    });

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
