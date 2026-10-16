import { PrismaService, cleanDatabaseForContractTests } from '../../../../shared';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttentionVersionRepositoryPort } from '../../domain/clinical-attention-version.repository.port';
import { InMemoryClinicalAttentionRepository } from './in-memory-clinical-attention.repository';
import { InMemoryClinicalAttentionVersionRepository } from './in-memory-clinical-attention-version.repository';
import { PrismaClinicalAttentionRepository } from './prisma-clinical-attention.repository';
import { PrismaClinicalAttentionVersionRepository } from './prisma-clinical-attention-version.repository';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionVersion } from '../../domain/clinical-attention-version.entity';
import { AttentionMaterialUsed } from '../../domain/attention-material-used.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import {
  DuplicateClinicalAttentionVersionError,
  ClinicalAttentionClosedError,
} from '../../domain/clinical.errors';
import { Prisma } from '@prisma/client';

interface RepositoryFactory {
  name: string;
  createRepo: () => {
    repo: ClinicalAttentionRepositoryPort;
    versionRepo: ClinicalAttentionVersionRepositoryPort;
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
    await cleanDatabaseForContractTests(realPrisma);
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
        versionRepo: new InMemoryClinicalAttentionVersionRepository(),
      }),
    },
    {
      name: 'PrismaClinicalAttentionRepository (Real PostgreSQL)',
      createRepo: () => ({
        repo: new PrismaClinicalAttentionRepository(realPrisma),
        versionRepo: new PrismaClinicalAttentionVersionRepository(realPrisma),
        cleanup: async () => {
          await cleanDb();
        },
      }),
    },
  ];

  implementations.forEach(({ name, createRepo }) => {
    describe(`Suite: ${name}`, () => {
      let repo: ClinicalAttentionRepositoryPort;
      let versionRepo: ClinicalAttentionVersionRepositoryPort;
      let cleanupFn: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        if (name.includes('PostgreSQL')) {
          await cleanDb();
          await ensurePrerequisites();
        }
        const created = createRepo();
        repo = created.repo;
        versionRepo = created.versionRepo;
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

      it('debe cerrar una atención clínica completa pasando a CLOSED e impedir ediciones ordinarias posteriores', async () => {
        const attention = ClinicalAttention.create({
          id: 'att-contract-close',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          clinicalHistoryId: 'hist-contract-1',
          attendedByUserId: 'usr-contract-1',
          status: ClinicalAttentionStatus.OPEN,
          proceduresPerformed: [
            {
              code: 'RES-01',
              name: 'Resina',
              toothNumber: '16',
            },
          ],
          evolutionNotes: 'Procedimiento concluido con éxito',
          attendedAt: fixedNow,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        await repo.save(attention);

        const closeTime = new Date('2026-10-16T11:00:00.000Z');
        attention.close(closeTime);
        await repo.save(attention);

        const reloaded = await repo.findById('clinic-contract-1', 'att-contract-close');
        expect(reloaded).not.toBeNull();
        expect(reloaded!.status).toBe(ClinicalAttentionStatus.CLOSED);
        expect(reloaded!.updatedAt).toEqual(closeTime);

        // Intento de edición ordinaria sobre atención cerrada debe lanzar ClinicalAttentionClosedError
        expect(() =>
          reloaded!.update({
            evolutionNotes: 'Intento inválido de edición tras cierre',
            updatedAt: new Date('2026-10-16T12:00:00.000Z'),
          }),
        ).toThrow(ClinicalAttentionClosedError);
      });

      it('debe enmendar una atención cerrada guardando la versión inmutable previa y ocultando privateNotes en el historial para AUXILIARY', async () => {
        const attention = ClinicalAttention.create({
          id: 'att-contract-amend',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          clinicalHistoryId: 'hist-contract-1',
          attendedByUserId: 'usr-contract-1',
          status: ClinicalAttentionStatus.OPEN,
          proceduresPerformed: [{ code: 'RES-01', name: 'Resina previa' }],
          evolutionNotes: 'Evolución original previa a la enmienda',
          prescription: 'Amoxicilina 500mg',
          privateNotes: 'Nota privada confidencial original',
          attendedAt: fixedNow,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });

        attention.close(new Date('2026-10-16T10:30:00.000Z'));
        await repo.save(attention);

        // Guardar versión previa inmutable
        const version1 = ClinicalAttentionVersion.create({
          id: 'ver-contract-1',
          clinicId: 'clinic-contract-1',
          attentionId: 'att-contract-amend',
          versionNumber: 1,
          previousData: attention.toSnapshotData(),
          changeReason: 'Aclaración de dosis y notas de evolución rectificadas',
          amendedByUserId: 'usr-contract-1',
          createdAt: new Date('2026-10-16T11:00:00.000Z'),
        });
        await versionRepo.save(version1);

        // Enmendar atención
        const amendTime = new Date('2026-10-16T11:00:00.000Z');
        attention.amend({
          changeReason: 'Aclaración de dosis y notas de evolución rectificadas',
          evolutionNotes: 'Evolución enmendada con nuevos hallazgos',
          prescription: 'Amoxicilina 875mg',
          privateNotes: 'Nota privada enmendada',
          updatedAt: amendTime,
        });
        await repo.save(attention);

        // Verificar atención enmendada persistida
        const reloaded = await repo.findById('clinic-contract-1', 'att-contract-amend');
        expect(reloaded).not.toBeNull();
        expect(reloaded!.evolutionNotes).toBe('Evolución enmendada con nuevos hallazgos');
        expect(reloaded!.prescription).toBe('Amoxicilina 875mg');
        expect(reloaded!.privateNotes).toBe('Nota privada enmendada');

        // Consultar versiones históricas
        const versions = await versionRepo.findAllByAttentionId(
          'clinic-contract-1',
          'att-contract-amend',
        );
        expect(versions).toHaveLength(1);
        expect(versions[0].versionNumber).toBe(1);
        expect(versions[0].changeReason).toBe(
          'Aclaración de dosis y notas de evolución rectificadas',
        );
        expect(versions[0].previousData.evolutionNotes).toBe(
          'Evolución original previa a la enmienda',
        );

        // Enmascarar privateNotes para AUXILIARY
        const maskedAuxiliary = versions[0].maskPrivateNotesForViewer('AUXILIARY');
        expect(maskedAuxiliary.previousData.privateNotes).toBeNull();

        // Preservar privateNotes para ADMIN
        const preservedAdmin = versions[0].maskPrivateNotesForViewer('ADMIN');
        expect(preservedAdmin.previousData.privateNotes).toBe('Nota privada confidencial original');
      });

      it('debe rechazar con DuplicateClinicalAttentionVersionError si se intenta guardar una versión con el mismo versionNumber (P2002)', async () => {
        const attention = ClinicalAttention.create({
          id: 'att-contract-dup',
          clinicId: 'clinic-contract-1',
          patientId: 'pat-contract-1',
          clinicalHistoryId: 'hist-contract-1',
          attendedByUserId: 'usr-contract-1',
          status: ClinicalAttentionStatus.OPEN,
          proceduresPerformed: [{ code: 'RES-01' }],
          evolutionNotes: 'Evolución base',
          attendedAt: fixedNow,
          createdAt: fixedNow,
          updatedAt: fixedNow,
        });
        attention.close(fixedNow);
        await repo.save(attention);

        const version1 = ClinicalAttentionVersion.create({
          id: 'ver-contract-dup-1',
          clinicId: 'clinic-contract-1',
          attentionId: 'att-contract-dup',
          versionNumber: 1,
          previousData: attention.toSnapshotData(),
          changeReason: 'Primer cambio',
          amendedByUserId: 'usr-contract-1',
          createdAt: fixedNow,
        });
        await versionRepo.save(version1);

        const duplicateVersion = ClinicalAttentionVersion.create({
          id: 'ver-contract-dup-2',
          clinicId: 'clinic-contract-1',
          attentionId: 'att-contract-dup',
          versionNumber: 1,
          previousData: attention.toSnapshotData(),
          changeReason: 'Segundo cambio con versión colisionada',
          amendedByUserId: 'usr-contract-1',
          createdAt: fixedNow,
        });

        await expect(versionRepo.save(duplicateVersion)).rejects.toThrow(
          DuplicateClinicalAttentionVersionError,
        );
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

    it('debe impedir borrado de Clinic, ClinicalAttention y User si existe ClinicalAttentionVersion asociada (onDelete: Restrict)', async () => {
      const repo = new PrismaClinicalAttentionRepository(realPrisma);
      const versionRepo = new PrismaClinicalAttentionVersionRepository(realPrisma);

      const attention = ClinicalAttention.create({
        id: 'att-restrict-v1',
        clinicId: 'clinic-contract-1',
        patientId: 'pat-contract-1',
        clinicalHistoryId: 'hist-contract-1',
        attendedByUserId: 'usr-contract-1',
        status: ClinicalAttentionStatus.OPEN,
        proceduresPerformed: [{ code: 'RES-01' }],
        evolutionNotes: 'Atención para probar Restrict de versiones',
        attendedAt: fixedNow,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });
      attention.close(fixedNow);
      await repo.save(attention);

      const version = ClinicalAttentionVersion.create({
        id: 'ver-restrict-1',
        clinicId: 'clinic-contract-1',
        attentionId: 'att-restrict-v1',
        versionNumber: 1,
        previousData: attention.toSnapshotData(),
        changeReason: 'Razón de prueba para Restrict FK',
        amendedByUserId: 'usr-contract-1',
        createdAt: fixedNow,
      });
      await versionRepo.save(version);

      // Intento de borrar ClinicalAttention debe fallar por Restrict en ClinicalAttentionVersion
      await expect(
        realPrisma.clinicalAttention.delete({ where: { id: 'att-restrict-v1' } }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);

      // Intento de borrar User (amendedByUserId) debe fallar por Restrict
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
