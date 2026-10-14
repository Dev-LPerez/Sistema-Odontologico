import {
  Patient as PrismaPatient,
  DocumentType as PrismaDocumentType,
  AcquisitionSource as PrismaAcquisitionSource,
  Prisma,
} from '@prisma/client';
import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { EmergencyContact } from '../../domain/emergency-contact.vo';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';

export class PatientMapper {
  static toDomain(raw: PrismaPatient): Patient {
    const document = DocumentIdentity.create(
      raw.documentType as unknown as DocumentType,
      raw.documentNumber,
    );

    const phone = PhoneNumber.create(raw.phone);

    let emergencyContact: EmergencyContact | null = null;
    if (raw.emergencyContactName && raw.emergencyContactPhone) {
      emergencyContact = EmergencyContact.create(
        raw.emergencyContactName,
        PhoneNumber.create(raw.emergencyContactPhone),
      );
    }

    return Patient.create({
      id: raw.id,
      clinicId: raw.clinicId,
      firstName: raw.firstName,
      lastName: raw.lastName,
      document,
      birthDate: raw.birthDate,
      phone,
      email: raw.email,
      address: raw.address,
      emergencyContact,
      acquisitionSource: raw.acquisitionSource as unknown as AcquisitionSource,
      dataTreatmentConsent: raw.dataTreatmentConsent,
      dataTreatmentConsentAt: raw.dataTreatmentConsentAt,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(domain: Patient): Prisma.PatientUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      firstName: domain.firstName,
      lastName: domain.lastName,
      documentType: domain.document.type as unknown as PrismaDocumentType,
      documentNumber: domain.document.number,
      birthDate: domain.birthDate,
      phone: domain.phone.value,
      email: domain.email,
      address: domain.address,
      emergencyContactName: domain.emergencyContact?.name ?? null,
      emergencyContactPhone: domain.emergencyContact?.phone.value ?? null,
      acquisitionSource: domain.acquisitionSource as unknown as PrismaAcquisitionSource,
      dataTreatmentConsent: domain.dataTreatmentConsent,
      dataTreatmentConsentAt: domain.dataTreatmentConsentAt,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
