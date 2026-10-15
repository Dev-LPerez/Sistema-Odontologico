import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';

export interface SearchPatientsByTrigramParams {
  clinicId: string;
  query: string;
  normalizedDigits?: string;
  includeInactive?: boolean;
  limit?: number;
}

export interface PatientSearchItemDto {
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
  similarityScore?: number;
}

export const PATIENT_QUERIES_TOKEN = Symbol('PATIENT_QUERIES_TOKEN');

export interface PatientQueriesPort {
  searchByTrigram(params: SearchPatientsByTrigramParams): Promise<PatientSearchItemDto[]>;
}
