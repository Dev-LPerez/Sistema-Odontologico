import { OdontogramSnapshotRepositoryPort } from '../../domain/odontogram-snapshot.repository.port';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';

export class InMemoryOdontogramSnapshotRepository implements OdontogramSnapshotRepositoryPort {
  private readonly snapshots = new Map<string, OdontogramSnapshot>();

  async findAllByPatientId(clinicId: string, patientId: string): Promise<OdontogramSnapshot[]> {
    const results: OdontogramSnapshot[] = [];
    for (const snap of this.snapshots.values()) {
      if (snap.clinicId === clinicId && snap.patientId === patientId) {
        results.push(snap);
      }
    }
    return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async save(snapshot: OdontogramSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  clear(): void {
    this.snapshots.clear();
  }
}
