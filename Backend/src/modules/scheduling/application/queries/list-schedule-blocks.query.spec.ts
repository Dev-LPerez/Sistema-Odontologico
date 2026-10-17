import { ListScheduleBlocksQuery } from './list-schedule-blocks.query';
import { ScheduleBlockRepositoryPort } from '../../domain/schedule-block.repository.port';
import { ScheduleBlock } from '../../domain/schedule-block.entity';

class FakeScheduleBlockRepository implements ScheduleBlockRepositoryPort {
  private blocks: ScheduleBlock[] = [];

  async save(block: ScheduleBlock): Promise<void> {
    this.blocks.push(block);
  }

  async findById(clinicId: string, id: string): Promise<ScheduleBlock | null> {
    return this.blocks.find((b) => b.clinicId === clinicId && b.id === id) || null;
  }

  async findColliding(
    clinicId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<ScheduleBlock | null> {
    return (
      this.blocks.find(
        (b) =>
          b.clinicId === clinicId &&
          startTime.getTime() < b.endDate.getTime() &&
          endTime.getTime() > b.startDate.getTime(),
      ) || null
    );
  }

  async listByClinicId(clinicId: string, fromDate?: Date): Promise<ScheduleBlock[]> {
    return this.blocks
      .filter((b) => {
        if (b.clinicId !== clinicId) return false;
        if (fromDate && b.endDate.getTime() < fromDate.getTime()) return false;
        return true;
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }
}

describe('ListScheduleBlocksQuery', () => {
  let query: ListScheduleBlocksQuery;
  let repo: FakeScheduleBlockRepository;

  beforeEach(() => {
    repo = new FakeScheduleBlockRepository();
    query = new ListScheduleBlocksQuery(repo);
  });

  it('should list schedule blocks for a clinic', async () => {
    const block = ScheduleBlock.create({
      id: 'block-1',
      clinicId: 'clinic-123',
      startDate: new Date('2026-12-20T00:00:00.000Z'),
      endDate: new Date('2026-12-25T23:59:59.000Z'),
      reason: 'Vacaciones',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await repo.save(block);

    const result = await query.execute({ clinicId: 'clinic-123' });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('Vacaciones');
  });
});
