import { PrismaService, cleanDatabaseForContractTests } from '../../../../shared';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { InMemoryAvailabilityRepository } from './in-memory-availability.repository';
import { PrismaAvailabilityRepository } from './prisma-availability.repository';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';

describe('AvailabilityRepository Contract Tests (RC-018, RC-050)', () => {
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
      where: { id: 'clinic-avail-1' },
      create: { id: 'clinic-avail-1', name: 'Clínica Avail 1' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-avail-2' },
      create: { id: 'clinic-avail-2', name: 'Clínica Avail 2' },
      update: {},
    });
  };

  const implementations: {
    name: string;
    createRepo: () => { repo: AvailabilityRepositoryPort; cleanup?: () => Promise<void> };
  }[] = [
    {
      name: 'InMemoryAvailabilityRepository',
      createRepo: () => ({ repo: new InMemoryAvailabilityRepository() }),
    },
    {
      name: 'PrismaAvailabilityRepository',
      createRepo: () => ({
        repo: new PrismaAvailabilityRepository(realPrisma),
        cleanup: async () => {
          await cleanDb();
          await ensurePrerequisites();
        },
      }),
    },
  ];

  implementations.forEach(({ name, createRepo }) => {
    describe(name, () => {
      let repo: AvailabilityRepositoryPort;
      let cleanupFn: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        const instance = createRepo();
        repo = instance.repo;
        cleanupFn = instance.cleanup;
        if (cleanupFn) {
          await cleanupFn();
        }
      });

      it('should save and retrieve weekly availability by clinicId', async () => {
        const availability = WeeklyAvailability.create({
          clinicId: 'clinic-avail-1',
          slots: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
          ],
          maxDailyAppointments: 4,
        });

        await repo.save(availability);

        const found = await repo.findByClinicId('clinic-avail-1');
        expect(found).not.toBeNull();
        expect(found!.clinicId).toBe('clinic-avail-1');
        expect(found!.maxDailyAppointments).toBe(4);
        expect(found!.slots.length).toBe(2);
      });

      it('should return null when clinic has no configured availability', async () => {
        const found = await repo.findByClinicId('clinic-non-existent');
        expect(found).toBeNull();
      });

      it('should update existing availability on subsequent save', async () => {
        const availability = WeeklyAvailability.create({
          clinicId: 'clinic-avail-1',
          slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
          maxDailyAppointments: 3,
        });
        await repo.save(availability);

        availability.update(
          [
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' },
          ],
          4,
          new Date(),
        );
        await repo.save(availability);

        const updated = await repo.findByClinicId('clinic-avail-1');
        expect(updated!.maxDailyAppointments).toBe(4);
        expect(updated!.slots.length).toBe(2);
      });
    });
  });
});
