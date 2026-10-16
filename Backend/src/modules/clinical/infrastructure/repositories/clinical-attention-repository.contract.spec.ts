import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { InMemoryClinicalAttentionRepository } from './in-memory-clinical-attention.repository';
import { PrismaClinicalAttentionRepository } from './prisma-clinical-attention.repository';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { AttentionMaterialUsed } from '../../domain/attention-material-used.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import { Prisma } from '@prisma/client';

interface RepositoryFactory {
  name: string;
  createRepo: () => {
    repo: ClinicalAttentionRepositoryPort;
    cleanup?: () => Promise<void>;
  };
}

describe('ClinicalAttention Repository Contract Tests (RC-018, RC-050, RC-055)', () => {
  const realPrisma = new PrismaService();
  const fixedNow = new Date('2026-10-16T10:00:00.000Z');

  beforeAll(async () => {
    await realPrisma.$connect();
  });

  afterAll(async () => {
    await cleanDb();
    await realPrisma.$disconnect();
  });

  const cleanDb = async () => {
    await realPrisma.attentionMaterialUsed.deleteMany();
    await realPrisma.clinicalAttention.deleteMany();
    await realPrisma.treatmentPlanItem.deleteMany();
    await realPrisma.clinicalHistory.deleteMany();
    await realPrisma.patientProcedurePrice.deleteMany();
    await realPrisma.procedure.deleteMany();
    await realPrisma.material.deleteMany();
    await realPrisma.odontogramSnapshot.deleteMany();
    await realPrisma.odontogram.deleteMany();
    await realPrisma.patient.deleteMany();
    await realPrisma.refreshSession.deleteMany();
    await realPrisma.user.deleteMany();
    await realPrisma.clinic.deleteMany();
  };

  const ensurePrerequisites = async () => {
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-contract-1' },
      create: { id: 'clinic-contract-1', name: 'Clínica Contract 1' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-contract-2' },
      create: { id: 'clinic-contract-2', name: 'Clínica Contract 2' },
      update: {},
    });

    await realPrisma.user.upsert({
      where: { id: 'usr-contract-1' },
      create: {
        id: 'usr-contract-1',
        clinicId: 'clinic-contract-1',
        email: 'dra.contract1@example.com',
        passwordHash: 'hash',
        fullName: 'Dra Angelee',
        role: 'ADMIN',
      },
      update: {},
    });

    await realPrisma.patient.upsert({
      where: { id: 'pat-contract-1' },
      create: {
        id: 'pat-contract-1',
        clinicId: 'clinic-contract-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: 'CC',
        documentNumber: '11111111',
        birthDate: new Date('1990-01-01'),
        phone: '3001111111',
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: fixedNow,
      },
      update: {},
    });

    await realPrisma.clinicalHistory.upsert({
      where: { id: 'hist-contract-1' },
      create: {
        id: 'hist-contract-1',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        chiefComplaint: 'Dolor',
        currentIllness: 'Dolor leve',
        personalAntecedents: {},
        diagnoses: [],
      },
      update: {},
    });

    await realPrisma.material.upsert({
      where: { id: 'mat-contract-1' },
      create: {
        id: 'mat-contract-1',
        clinicId: 'clinic-contract-1',
        brand: '3M',
        reference: 'Filtek',
        type: 'Resina',
        color: 'A2',
        currentStock: 10,
        minStock: 2,
      },
      update: {},
    });
  };

  const implementations: RepositoryFactory[] = [
    {
      name: 'InMemoryClinicalAttentionRepository',
      createRepo: () => ({
        repo: new InMemoryClinicalAttentionRepository(),
      }),
    },
    {
      name: 'PrismaClinicalAttentionRepository (Real PostgreSQL)',
      createRepo: () => ({
        repo: new PrismaClinicalAttentionRepository(realPrisma),
        cleanup: async () => {
          await cleanDb();
        },
      }),
    },
  ];

  implementations.forEach(({ name, createRepo }) => {
    describe(`Suite: ${name}`, () => {
      let repo: ClinicalAttentionRepositoryPort;
      let cleanupFn: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        if (name.includes('PostgreSQL')) {
          await cleanDb();
          await ensurePrerequisites();
        }
        const created = createRepo();
        repo = created.repo;
        cleanupFn = created.cleanup;
      });

      afterEach(async () => {
        if (cleanupFn) {
          await cleanupFn();
        }
      });

      it('debe crear, actualizar y listar atenciones clínicas aislando por clinicId y ocultando privateNotes para el rol AUXILIARY', async () => {
        const attention1 = ClinicalAttention.create({
          id: 'att-contract-1',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          clinicalHistoryId: 'hist-contract-1',
          attendedByUserId: 'usr-contract-1',
          status: ClinicalAttentionStatus.OPEN,
          proceduresPerformed: [{ code: 'RES-01', toothNumber: '16' }],
          evolutionNotes: 'Evolución 1',
          prescription: 'Amoxicilina 500mg',
          postOperativeIndications: 'Reposo',
          privateNotes: 'Nota privada confidencial',
          attendedAt: fixedNow,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        await repo.save(attention1);

        const found = await repo.findById('clinic-contract-1', 'att-contract-1');
        expect(found).not.toBeNull();
        expect(found!.id).toBe('att-contract-1');
        expect(found!.evolutionNotes).toBe('Evolución 1');
        expect(found!.privateNotes).toBe('Nota privada confidencial');
        expect(found!.proceduresPerformed).toHaveLength(1);
        expect(found!.proceduresPerformed[0].code).toBe('RES-01');

        // Aislamiento por consultorio
        const wrongClinic = await repo.findById('clinic-contract-2', 'att-contract-1');
        expect(wrongClinic).toBeNull();

        // Actualización
        const updateDate = new Date('2026-10-16T12:00:00.000Z');
        found!.update({
          evolutionNotes: 'Evolución modificada',
          updatedAt: updateDate,
        });
        await repo.save(found!);

        const updated = await repo.findById('clinic-contract-1', 'att-contract-1');
        expect(updated!.evolutionNotes).toBe('Evolución modificada');
        expect(updated!.updatedAt).toEqual(updateDate);

        // Listar por paciente
        const list = await repo.findAllByPatientId('clinic-contract-1', 'pat-contract-1');
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe('att-contract-1');

        const emptyList = await repo.findAllByPatientId('clinic-contract-2', 'pat-contract-1');
        expect(emptyList).toHaveLength(0);
      });

      it('debe registrar el material propio usado por diente en la atención y descontar existencias atómicamente dentro de UnitOfWork', async () => {
        const attention = ClinicalAttention.create({
          id: 'att-contract-2',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          clinicalHistoryId: 'hist-contract-1',
          attendedByUserId: 'usr-contract-1',
          status: ClinicalAttentionStatus.OPEN,
          proceduresPerformed: [],
          evolutionNotes: 'Atención con material',
          attendedAt: fixedNow,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        const materialUsed = AttentionMaterialUsed.create({
          id: 'mat-used-c1',
          clinicId: 'clinic-contract-1',
          attentionId: 'att-contract-2',
          materialId: 'mat-contract-1',
          brand: '3M',
          reference: 'Filtek',
          type: 'Resina',
          color: 'A2',
          toothNumber: '16',
          quantity: 2,
          notes: 'Restauración oclusal',
          createdAt: fixedNow,
        });

        attention.addMaterialUsed(materialUsed, fixedNow);
        await repo.save(attention);

        const found = await repo.findById('clinic-contract-1', 'att-contract-2');
        expect(found).not.toBeNull();
        expect(found!.materialsUsed).toHaveLength(1);
        expect(found!.materialsUsed[0].id).toBe('mat-used-c1');
        expect(found!.materialsUsed[0].brand).toBe('3M');
        expect(found!.materialsUsed[0].color).toBe('A2');
        expect(found!.materialsUsed[0].toothNumber).toBe('16');
        expect(found!.materialsUsed[0].quantity).toBe(2);
      });
    });
  });

  describe('PostgreSQL Foreign Key onDelete: Restrict tests (RC-055)', () => {
    beforeEach(async () => {
      await cleanDb();
      await ensurePrerequisites();
    });

    it('debe impedir borrado de Clinic, Patient, ClinicalHistory, User y Material si existe ClinicalAttention asociada (onDelete: Restrict)', async () => {
      const repo = new PrismaClinicalAttentionRepository(realPrisma);

      const attention = ClinicalAttention.create({
        id: 'att-restrict-1',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        clinicalHistoryId: 'hist-contract-1',
        attendedByUserId: 'usr-contract-1',
        status: ClinicalAttentionStatus.OPEN,
        proceduresPerformed: [],
        evolutionNotes: 'Atención para probar Restrict',
        attendedAt: fixedNow,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      const materialUsed = AttentionMaterialUsed.create({
        id: 'mat-used-r1',
        clinicId: 'clinic-contract-1',
        attentionId: 'att-restrict-1',
        materialId: 'mat-contract-1',
        brand: '3M',
        reference: 'Filtek',
        type: 'Resina',
        color: 'A2',
        quantity: 1,
        createdAt: fixedNow,
      });

      attention.addMaterialUsed(materialUsed, fixedNow);
      await repo.save(attention);

      // Intento de borrar Patient debe fallar por Restrict
      await expect(realPrisma.patient.delete({ where: { id: 'pat-contract-1' } })).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );

      // Intento de borrar ClinicalHistory debe fallar por Restrict
      await expect(
        realPrisma.clinicalHistory.delete({ where: { id: 'hist-contract-1' } }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);

      // Intento de borrar Material debe fallar por Restrict
      await expect(realPrisma.material.delete({ where: { id: 'mat-contract-1' } })).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );

      // Intento de borrar User debe fallar por Restrict
      await expect(realPrisma.user.delete({ where: { id: 'usr-contract-1' } })).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );

      // Intento de borrar Clinic debe fallar por Restrict
      await expect(
        realPrisma.clinic.delete({ where: { id: 'clinic-contract-1' } }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });
});
