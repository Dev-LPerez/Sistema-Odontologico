import { Injectable, Inject } from '@nestjs/common';
import {
  PatientRepositoryPort,
  PATIENT_REPOSITORY_TOKEN,
} from '../../domain/patient.repository.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { EmergencyContact } from '../../domain/emergency-contact.vo';
import { Patient } from '../../domain/patient.entity';
import { DuplicatePatientDocumentError } from '../../domain/patients.errors';
import { ClockPort, CLOCK_PORT } from '../../../../shared/application/ports/clock.port';
import {
  IdGeneratorPort,
  ID_GENERATOR_PORT,
} from '../../../../shared/application/ports/id-generator.port';

export interface CreatePatientCommand {
  clinicId: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string | Date;
  phone: string;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  acquisitionSource?: AcquisitionSource;
  dataTreatmentConsent: boolean;
}

export interface PatientResult {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: Date;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  acquisitionSource: AcquisitionSource;
  dataTreatmentConsent: boolean;
  dataTreatmentConsentAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreatePatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepo: PatientRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreatePatientCommand): Promise<PatientResult> {
    const document = DocumentIdentity.create(command.documentType, command.documentNumber);

    const existingPatient = await this.patientRepo.findByDocument(
      command.clinicId,
      document.type,
      document.number,
    );

    if (existingPatient) {
      throw new DuplicatePatientDocumentError(document.number);
    }

    const phone = PhoneNumber.create(command.phone);
    let emergencyContact: EmergencyContact | null = null;

    if (command.emergencyContactName && command.emergencyContactPhone) {
      emergencyContact = EmergencyContact.create(
        command.emergencyContactName,
        PhoneNumber.create(command.emergencyContactPhone),
      );
    }

    const id = this.idGenerator.generate();
    const now = this.clock.now();
    const birthDate =
      typeof command.birthDate === 'string' ? new Date(command.birthDate) : command.birthDate;

    const patient = Patient.create({
      id,
      clinicId: command.clinicId,
      firstName: command.firstName,
      lastName: command.lastName,
      document,
      birthDate,
      phone,
      email: command.email,
      address: command.address,
      emergencyContact,
      acquisitionSource: command.acquisitionSource ?? AcquisitionSource.DIRECT,
      dataTreatmentConsent: command.dataTreatmentConsent,
      dataTreatmentConsentAt: now,
      isActive: true,
      createdAt: now,
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
