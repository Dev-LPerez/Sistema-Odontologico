import { ScheduleBlockRepositoryPort } from '../../domain/schedule-block.repository.port';
import { ScheduleBlock } from '../../domain/schedule-block.entity';

export class InMemoryScheduleBlockRepository implements ScheduleBlockRepositoryPort {
  private readonly items = new Map<string, ScheduleBlock>();

  async save(block: ScheduleBlock): Promise<void> {
    this.items.set(block.id, block);
  }

  async findById(clinicId: string, id: string): Promise<ScheduleBlock | null> {
    const item = this.items.get(id);
    if (!item || item.clinicId !== clinicId) {
      return null;
    }
    return item;
  }

  async findColliding(
    clinicId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<ScheduleBlock | null> {
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();

    for (const block of this.items.values()) {
      if (block.clinicId === clinicId) {
        if (startMs < block.endDate.getTime() && endMs > block.startDate.getTime()) {
          return block;
        }
      }
    }
    return null;
  }

  async listByClinicId(clinicId: string, fromDate?: Date): Promise<ScheduleBlock[]> {
    const fromMs = fromDate ? fromDate.getTime() : 0;
    return Array.from(this.items.values())
      .filter((block) => block.clinicId === clinicId && block.endDate.getTime() >= fromMs)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }
}
