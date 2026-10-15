import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { DuplicateClinicalHistoryError } from '../../domain/clinical.errors';

export class InMemoryClinicalHistoryRepository implements ClinicalHistoryRepositoryPort {
  private readonly histories = new Map<string, ClinicalHistory>();

  async findById(clinicId: string, id: string): Promise<ClinicalHistory | null> {
    const history = this.histories.get(id);
    if (!history || history.clinicId !== clinicId) {
      return null;
    }
    return history;
  }

  async findByPatientId(clinicId: string, patientId: string): Promise<ClinicalHistory | null> {
    for (const history of this.histories.values()) {
      if (history.clinicId === clinicId && history.patientId === patientId) {
        return history;
      }
    }
    return null;
  }

  async save(clinicalHistory: ClinicalHistory): Promise<void> {
    for (const existing of this.histories.values()) {
      if (
        existing.clinicId === clinicalHistory.clinicId &&
        existing.patientId === clinicalHistory.patientId &&
        existing.id !== clinicalHistory.id
      ) {
        throw new DuplicateClinicalHistoryError(clinicalHistory.patientId);
      }
    }

    this.histories.set(clinicalHistory.id, clinicalHistory);
  }

  clear(): void {
    this.histories.clear();
  }
}
