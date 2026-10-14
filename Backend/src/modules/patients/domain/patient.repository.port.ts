import { Patient } from './patient.entity';
import { DocumentType } from './document-type.enum';

export interface FindPotentialDuplicatesParams {
  documentNumber?: string;
  phone?: string;
  excludePatientId?: string;
}

export interface PatientRepositoryPort {
  findById(clinicId: string, id: string): Promise<Patient | null>;
  findByDocument(
    clinicId: string,
    documentType: DocumentType,
    documentNumber: string,
  ): Promise<Patient | null>;
  findPotentialDuplicates(
    clinicId: string,
    params: FindPotentialDuplicatesParams,
  ): Promise<Patient[]>;
  findAllByClinicId(clinicId: string, filter?: { isActive?: boolean }): Promise<Patient[]>;
  save(patient: Patient): Promise<void>;
}

export const PATIENT_REPOSITORY_TOKEN = Symbol('PatientRepositoryPort');
