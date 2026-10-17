import { CreateScheduleBlockUseCase } from './create-schedule-block.use-case';
import { ScheduleBlockRepositoryPort } from '../../domain/schedule-block.repository.port';
import { ScheduleBlock } from '../../domain/schedule-block.entity';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { InvalidScheduleBlockDataError } from '../../domain/schedule-block.entity';

class FakeScheduleBlockRepository implements ScheduleBlockRepositoryPort {
  private blocks: ScheduleBlock[] = [];

  async save(block: ScheduleBlock): Promise<void> {
    const idx = this.blocks.findIndex((b) => b.id === block.id);
    if (idx >= 0) {
      this.blocks[idx] = block;
    } else {
      this.blocks.push(block);
    }
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

describe('CreateScheduleBlockUseCase', () => {
  let useCase: CreateScheduleBlockUseCase;
  let repo: FakeScheduleBlockRepository;
  let fakeClock: ClockPort;
  let fakeIdGenerator: IdGeneratorPort;
  const fixedNow = new Date('2026-10-20T10:00:00.000Z');

  beforeEach(() => {
    repo = new FakeScheduleBlockRepository();
    fakeClock = {
      now: jest.fn().mockReturnValue(fixedNow),
      todayInBogota: jest.fn().mockReturnValue('2026-10-20'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-20 05:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    fakeIdGenerator = {
      generate: jest.fn().mockReturnValue('block-uuid-1'),
    };
    useCase = new CreateScheduleBlockUseCase(repo, fakeClock, fakeIdGenerator);
  });

  it('should create schedule block successfully', async () => {
    const startDate = new Date('2026-12-20T00:00:00.000Z');
    const endDate = new Date('2026-12-25T23:59:59.000Z');

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      startDate,
      endDate,
      reason: 'Vacaciones de fin de año',
    });

    expect(result.id).toBe('block-uuid-1');
    expect(result.clinicId).toBe('clinic-123');
    expect(result.reason).toBe('Vacaciones de fin de año');
    expect(result.startDate).toEqual(startDate);
    expect(result.endDate).toEqual(endDate);
    expect(result.createdAt).toEqual(fixedNow);
  });

  it('should reject when endDate is before startDate', async () => {
    const startDate = new Date('2026-12-25T00:00:00.000Z');
    const endDate = new Date('2026-12-20T00:00:00.000Z');

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        startDate,
        endDate,
        reason: 'Error en fechas',
      }),
    ).rejects.toThrow(InvalidScheduleBlockDataError);
  });
});
