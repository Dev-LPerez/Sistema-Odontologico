import { ClinicalAttentionVersionRepositoryPort } from '../../domain/clinical-attention-version.repository.port';
import { ClinicalAttentionVersion } from '../../domain/clinical-attention-version.entity';
import { DuplicateClinicalAttentionVersionError } from '../../domain/clinical.errors';

export class InMemoryClinicalAttentionVersionRepository implements ClinicalAttentionVersionRepositoryPort {
  private readonly items: ClinicalAttentionVersion[] = [];

  async findAllByAttentionId(
    clinicId: string,
    attentionId: string,
  ): Promise<ClinicalAttentionVersion[]> {
    return this.items
      .filter((v) => v.clinicId === clinicId && v.attentionId === attentionId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  async save(version: ClinicalAttentionVersion): Promise<void> {
    const isDuplicate = this.items.some(
      (v) =>
        v.clinicId === version.clinicId &&
        v.attentionId === version.attentionId &&
        v.versionNumber === version.versionNumber,
    );

    if (isDuplicate) {
      throw new DuplicateClinicalAttentionVersionError(version.attentionId, version.versionNumber);
    }

    this.items.push(version);
  }
}
