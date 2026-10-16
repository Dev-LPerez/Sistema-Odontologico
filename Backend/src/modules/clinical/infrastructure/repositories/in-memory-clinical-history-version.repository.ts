import { ClinicalHistoryVersionRepositoryPort } from '../../domain/clinical-history-version.repository.port';
import { ClinicalHistoryVersion } from '../../domain/clinical-history-version.entity';
import { DuplicateClinicalHistoryVersionError } from '../../domain/clinical.errors';

export class InMemoryClinicalHistoryVersionRepository implements ClinicalHistoryVersionRepositoryPort {
  private readonly items: ClinicalHistoryVersion[] = [];

  async findAllByHistoryId(clinicId: string, historyId: string): Promise<ClinicalHistoryVersion[]> {
    return this.items
      .filter((v) => v.clinicId === clinicId && v.clinicalHistoryId === historyId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  async save(version: ClinicalHistoryVersion): Promise<void> {
    const isDuplicate = this.items.some(
      (v) =>
        v.clinicId === version.clinicId &&
        v.clinicalHistoryId === version.clinicalHistoryId &&
        v.versionNumber === version.versionNumber,
    );

    if (isDuplicate) {
      throw new DuplicateClinicalHistoryVersionError(
        version.clinicalHistoryId,
        version.versionNumber,
      );
    }

    this.items.push(version);
  }

  clear(): void {
    this.items.length = 0;
  }
}
