import { PrismaService, cleanDatabaseForContractTests } from '../../../../shared';
import { ScheduleBlockRepositoryPort } from '../../domain/schedule-block.repository.port';
import { InMemoryScheduleBlockRepository } from './in-memory-schedule-block.repository';
import { PrismaScheduleBlockRepository } from './prisma-schedule-block.repository';
import { ScheduleBlock } from '../../domain/schedule-block.entity';

describe('ScheduleBlockRepository Contract Tests (RC-018, RC-050)', () => {
  const realPrisma = new PrismaService();

  beforeAll(async () => {
    await realPrisma.$connect();
  });

  afterAll(async () => {
    await cleanDb();
    await realPrisma.$disconnect();
  });

  const cleanDb = async () => {
    await cleanDatabaseForContractTests(realPrisma);
  };

  const ensurePrerequisites = async () => {
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-block-1' },
      create: { id: 'clinic-block-1', name: 'Clínica Block 1' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-block-2' },
      create: { id: 'clinic-block-2', name: 'Clínica Block 2' },
      update: {},
    });
  };

  const implementations: {
    name: string;
    createRepo: () => { repo: ScheduleBlockRepositoryPort; cleanup?: () => Promise<void> };
  }[] = [
    {
      name: 'InMemoryScheduleBlockRepository',
      createRepo: () => ({ repo: new InMemoryScheduleBlockRepository() }),
    },
    {
      name: 'PrismaScheduleBlockRepository',
      createRepo: () => ({
        repo: new PrismaScheduleBlockRepository(realPrisma),
        cleanup: async () => {
          await cleanDb();
          await ensurePrerequisites();
        },
      }),
    },
  ];

  implementations.forEach(({ name, createRepo }) => {
    describe(name, () => {
      let repo: ScheduleBlockRepositoryPort;
      let cleanupFn: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        const instance = createRepo();
        repo = instance.repo;
        cleanupFn = instance.cleanup;
        if (cleanupFn) {
          await cleanupFn();
        }
      });

      it('should save and find schedule block by id and clinicId', async () => {
        const block = ScheduleBlock.create({
          id: 'blk-1',
          clinicId: 'clinic-block-1',
          startDate: new Date('2026-12-24T00:00:00.000Z'),
          endDate: new Date('2026-12-25T23:59:59.000Z'),
          reason: 'Navidad',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repo.save(block);

        const found = await repo.findById('clinic-block-1', 'blk-1');
        expect(found).not.toBeNull();
        expect(found!.id).toBe('blk-1');
        expect(found!.reason).toBe('Navidad');

        // Isolation by clinicId
        const notFoundInOtherClinic = await repo.findById('clinic-block-2', 'blk-1');
        expect(notFoundInOtherClinic).toBeNull();
      });

      it('should detect colliding block for time range', async () => {
        const block = ScheduleBlock.create({
          id: 'blk-vacation',
          clinicId: 'clinic-block-1',
          startDate: new Date('2026-12-20T00:00:00.000Z'),
          endDate: new Date('2026-12-25T23:59:59.000Z'),
          reason: 'Vacaciones',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repo.save(block);

        const colliding = await repo.findColliding(
          'clinic-block-1',
          new Date('2026-12-22T14:00:00.000Z'),
          new Date('2026-12-22T15:00:00.000Z'),
        );
        expect(colliding).not.toBeNull();
        expect(colliding!.id).toBe('blk-vacation');

        const nonColliding = await repo.findColliding(
          'clinic-block-1',
          new Date('2026-12-28T14:00:00.000Z'),
          new Date('2026-12-28T15:00:00.000Z'),
        );
        expect(nonColliding).toBeNull();
      });

      it('should list blocks by clinicId ordered by startDate', async () => {
        const block1 = ScheduleBlock.create({
          id: 'blk-1',
          clinicId: 'clinic-block-1',
          startDate: new Date('2026-11-01T00:00:00.000Z'),
          endDate: new Date('2026-11-02T23:59:59.000Z'),
          reason: 'Día libre 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const block2 = ScheduleBlock.create({
          id: 'blk-2',
          clinicId: 'clinic-block-1',
          startDate: new Date('2026-12-01T00:00:00.000Z'),
          endDate: new Date('2026-12-02T23:59:59.000Z'),
          reason: 'Día libre 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await repo.save(block2);
        await repo.save(block1);

        const list = await repo.listByClinicId('clinic-block-1');
        expect(list.length).toBe(2);
        expect(list[0].id).toBe('blk-1');
        expect(list[1].id).toBe('blk-2');
      });
    });
  });
});
