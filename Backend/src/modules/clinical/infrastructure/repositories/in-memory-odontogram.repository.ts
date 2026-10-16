import { OdontogramRepositoryPort } from '../../domain/odontogram.repository.port';
import { Odontogram } from '../../domain/odontogram.entity';
import { DuplicateOdontogramError } from '../../domain/clinical.errors';

export class InMemoryOdontogramRepository implements OdontogramRepositoryPort {
  private readonly odontograms = new Map<string, Odontogram>();

  async findByPatientId(clinicId: string, patientId: string): Promise<Odontogram | null> {
    for (const odon of this.odontograms.values()) {
      if (odon.clinicId === clinicId && odon.patientId === patientId) {
        return odon;
      }
    }
    return null;
  }

  async save(odontogram: Odontogram): Promise<void> {
    for (const existing of this.odontograms.values()) {
      if (
        existing.clinicId === odontogram.clinicId &&
        existing.patientId === odontogram.patientId &&
        existing.id !== odontogram.id
      ) {
        throw new DuplicateOdontogramError(odontogram.patientId);
      }
    }

    this.odontograms.set(odontogram.id, odontogram);
  }

  clear(): void {
    this.odontograms.clear();
  }
}
