import { PrismaService, cleanDatabaseForContractTests } from '../../../../shared';
import { AppointmentRepositoryPort } from '../../domain/appointment.repository.port';
import { InMemoryAppointmentRepository } from './in-memory-appointment.repository';
import { PrismaAppointmentRepository } from './prisma-appointment.repository';
import { Appointment } from '../../domain/appointment.aggregate';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import { TimeSlot } from '../../domain/time-slot.vo';

describe('AppointmentRepository Contract Tests (RC-018, RC-050, RC-055)', () => {
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
      where: { id: 'clinic-apt-1' },
      create: { id: 'clinic-apt-1', name: 'Clínica Apt 1' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-apt-2' },
      create: { id: 'clinic-apt-2', name: 'Clínica Apt 2' },
      update: {},
    });

    await realPrisma.patient.upsert({
      where: { id: 'pat-apt-1' },
      create: {
        id: 'pat-apt-1',
        clinicId: 'clinic-apt-1',
        firstName: 'Carlos',
        lastName: 'Ramírez',
        documentType: 'CC',
        documentNumber: '10203040',
        birthDate: new Date('1992-05-10'),
        phone: '3119998877',
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: new Date(),
      },
      update: {},
    });

    await realPrisma.procedure.upsert({
      where: { id: 'proc-apt-1' },
      create: {
        id: 'proc-apt-1',
        clinicId: 'clinic-apt-1',
        code: 'RES-01',
        name: 'Resina Simple',
        basePriceCop: 120000,
      },
      update: {},
    });
  };

  const implementations: {
    name: string;
    createRepo: () => { repo: AppointmentRepositoryPort; cleanup?: () => Promise<void> };
  }[] = [
    {
      name: 'InMemoryAppointmentRepository',
      createRepo: () => ({ repo: new InMemoryAppointmentRepository() }),
    },
    {
      name: 'PrismaAppointmentRepository',
      createRepo: () => ({
        repo: new PrismaAppointmentRepository(realPrisma),
        cleanup: async () => {
          await cleanDb();
          await ensurePrerequisites();
        },
      }),
    },
  ];

  implementations.forEach(({ name, createRepo }) => {
    describe(name, () => {
      let repo: AppointmentRepositoryPort;
      let cleanupFn: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        const instance = createRepo();
        repo = instance.repo;
        cleanupFn = instance.cleanup;
        if (cleanupFn) {
          await cleanupFn();
        }
      });

      it('should save and find appointment by id and clinicId', async () => {
        const slot = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60);
        const apt = Appointment.create({
          id: 'apt-test-1',
          clinicId: 'clinic-apt-1',
          patientId: 'pat-apt-1',
          procedureId: 'proc-apt-1',
          timeSlot: slot,
          notes: 'Consulta inicial',
        });

        await repo.save(apt);

        const found = await repo.findById('clinic-apt-1', 'apt-test-1');
        expect(found).not.toBeNull();
        expect(found!.id).toBe('apt-test-1');
        expect(found!.clinicId).toBe('clinic-apt-1');
        expect(found!.status).toBe(AppointmentStatus.SCHEDULED);
        expect(found!.timeSlot.durationMinutes).toBe(60);

        // Clinic isolation
        const notFoundInOtherClinic = await repo.findById('clinic-apt-2', 'apt-test-1');
        expect(notFoundInOtherClinic).toBeNull();
      });

      it('should detect conflicting active appointment within overlapping time slot', async () => {
        const slot1 = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60); // 14:00 to 15:00
        const apt1 = Appointment.create({
          id: 'apt-c1',
          clinicId: 'clinic-apt-1',
          patientId: 'pat-apt-1',
          procedureId: 'proc-apt-1',
          timeSlot: slot1,
        });
        await repo.save(apt1);

        // Overlapping slot (14:30 to 15:30)
        const conflict = await repo.findConflicting(
          'clinic-apt-1',
          new Date('2026-10-20T14:30:00.000Z'),
          new Date('2026-10-20T15:30:00.000Z'),
        );
        expect(conflict).not.toBeNull();
        expect(conflict!.id).toBe('apt-c1');

        // Excluding self when rescheduling
        const conflictExcludingSelf = await repo.findConflicting(
          'clinic-apt-1',
          new Date('2026-10-20T14:30:00.000Z'),
          new Date('2026-10-20T15:30:00.000Z'),
          'apt-c1',
        );
        expect(conflictExcludingSelf).toBeNull();

        // Separate slot (15:00 to 16:00 - contiguous)
        const contiguous = await repo.findConflicting(
          'clinic-apt-1',
          new Date('2026-10-20T15:00:00.000Z'),
          new Date('2026-10-20T16:00:00.000Z'),
        );
        expect(contiguous).toBeNull();
      });

      it('should ignore CANCELLED appointments when checking conflicts', async () => {
        const slot = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60);
        const apt = Appointment.create({
          id: 'apt-cancelled',
          clinicId: 'clinic-apt-1',
          patientId: 'pat-apt-1',
          procedureId: 'proc-apt-1',
          timeSlot: slot,
        });
        apt.cancel('Cancelada por paciente', new Date());
        await repo.save(apt);

        const conflict = await repo.findConflicting(
          'clinic-apt-1',
          new Date('2026-10-20T14:00:00.000Z'),
          new Date('2026-10-20T15:00:00.000Z'),
        );
        expect(conflict).toBeNull();
      });

      it('should accurately count active appointments for a day range', async () => {
        const dayStart = new Date('2026-10-20T00:00:00.000Z');
        const dayEnd = new Date('2026-10-20T23:59:59.999Z');

        const apt1 = Appointment.create({
          id: 'apt-day-1',
          clinicId: 'clinic-apt-1',
          patientId: 'pat-apt-1',
          procedureId: 'proc-apt-1',
          timeSlot: TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60),
        });
        const apt2 = Appointment.create({
          id: 'apt-day-2',
          clinicId: 'clinic-apt-1',
          patientId: 'pat-apt-1',
          procedureId: 'proc-apt-1',
          timeSlot: TimeSlot.create(new Date('2026-10-20T16:00:00.000Z'), 60),
        });
        const aptCancelled = Appointment.create({
          id: 'apt-day-3',
          clinicId: 'clinic-apt-1',
          patientId: 'pat-apt-1',
          procedureId: 'proc-apt-1',
          timeSlot: TimeSlot.create(new Date('2026-10-20T18:00:00.000Z'), 60),
        });
        aptCancelled.cancel('Motivo', new Date());

        await repo.save(apt1);
        await repo.save(apt2);
        await repo.save(aptCancelled);

        const count = await repo.countDailyActiveAppointments('clinic-apt-1', dayStart, dayEnd);
        expect(count).toBe(2);

        // Exclude self
        const countExcluding = await repo.countDailyActiveAppointments(
          'clinic-apt-1',
          dayStart,
          dayEnd,
          'apt-day-1',
        );
        expect(countExcluding).toBe(1);
      });
    });
  });
});
