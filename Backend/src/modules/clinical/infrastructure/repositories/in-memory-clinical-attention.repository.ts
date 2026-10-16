import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';

export class InMemoryClinicalAttentionRepository implements ClinicalAttentionRepositoryPort {
  private readonly items = new Map<string, ClinicalAttention>();

  async findById(clinicId: string, id: string): Promise<ClinicalAttention | null> {
    const attention = this.items.get(id);
    if (!attention || attention.clinicId !== clinicId) {
      return null;
    }
    return attention;
  }

  async findAllByPatientId(clinicId: string, patientId: string): Promise<ClinicalAttention[]> {
    return Array.from(this.items.values())
      .filter((att) => att.clinicId === clinicId && att.patientId === patientId)
      .sort((a, b) => b.attendedAt.getTime() - a.attendedAt.getTime());
  }

  async save(attention: ClinicalAttention): Promise<void> {
    this.items.set(attention.id, attention);
  }
}
