import {
  PatientRepositoryPort,
  FindPotentialDuplicatesParams,
} from '../../domain/patient.repository.port';
import { Patient } from '../../domain/patient.entity';
import { DocumentType } from '../../domain/document-type.enum';
import { DuplicatePatientDocumentError } from '../../domain/patients.errors';

export class InMemoryPatientRepository implements PatientRepositoryPort {
  private readonly patients: Map<string, Patient> = new Map();

  async findById(clinicId: string, id: string): Promise<Patient | null> {
    const patient = this.patients.get(id);
    if (!patient || patient.clinicId !== clinicId) {
      return null;
    }
    return patient;
  }

  async findByDocument(
    clinicId: string,
    documentType: DocumentType,
    documentNumber: string,
  ): Promise<Patient | null> {
    for (const patient of this.patients.values()) {
      if (
        patient.clinicId === clinicId &&
        patient.document.type === documentType &&
        patient.document.number === documentNumber
      ) {
        return patient;
      }
    }
    return null;
  }

  async findPotentialDuplicates(
    clinicId: string,
    params: FindPotentialDuplicatesParams,
  ): Promise<Patient[]> {
    const results: Patient[] = [];

    for (const patient of this.patients.values()) {
      if (patient.clinicId !== clinicId) {
        continue;
      }

      if (params.excludePatientId && patient.id === params.excludePatientId) {
        continue;
      }

      const matchDoc =
        params.documentNumber !== undefined && patient.document.number === params.documentNumber;

      const matchPhone = params.phone !== undefined && patient.phone.value === params.phone;

      if (matchDoc || matchPhone) {
        results.push(patient);
      }
    }

    return results;
  }

  async findAllByClinicId(clinicId: string, filter?: { isActive?: boolean }): Promise<Patient[]> {
    const results: Patient[] = [];

    for (const patient of this.patients.values()) {
      if (patient.clinicId !== clinicId) {
        continue;
      }

      if (filter?.isActive !== undefined && patient.isActive !== filter.isActive) {
        continue;
      }

      results.push(patient);
    }

    return results;
  }

  async save(patient: Patient): Promise<void> {
    for (const existing of this.patients.values()) {
      if (
        existing.id !== patient.id &&
        existing.clinicId === patient.clinicId &&
        existing.document.type === patient.document.type &&
        existing.document.number === patient.document.number
      ) {
        throw new DuplicatePatientDocumentError(patient.document.number);
      }
    }
    this.patients.set(patient.id, patient);
  }

  clear(): void {
    this.patients.clear();
  }
}
