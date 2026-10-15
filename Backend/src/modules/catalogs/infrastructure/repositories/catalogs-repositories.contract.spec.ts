import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ProcedureRepositoryPort } from '../../domain/procedure.repository.port';
import { PatientProcedurePriceRepositoryPort } from '../../domain/patient-procedure-price.repository.port';
import { MaterialRepositoryPort } from '../../domain/material.repository.port';
import { InMemoryProcedureRepository } from './in-memory-procedure.repository';
import { InMemoryPatientProcedurePriceRepository } from './in-memory-patient-procedure-price.repository';
import { InMemoryMaterialRepository } from './in-memory-material.repository';
import { PrismaProcedureRepository } from './prisma-procedure.repository';
import { PrismaPatientProcedurePriceRepository } from './prisma-patient-procedure-price.repository';
import { PrismaMaterialRepository } from './prisma-material.repository';
import { Procedure } from '../../domain/procedure.entity';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';
import { Material } from '../../domain/material.entity';
import { Money } from '../../domain/money.vo';
import {
  DuplicateProcedureCodeError,
  DuplicateMaterialCatalogError,
} from '../../domain/catalogs.errors';
import { Prisma } from '@prisma/client';

interface CatalogsRepositoryFactory {
  name: string;
  createRepos: () => {
    procedureRepo: ProcedureRepositoryPort;
    patientPriceRepo: PatientProcedurePriceRepositoryPort;
    materialRepo: MaterialRepositoryPort;
    cleanup?: () => Promise<void>;
  };
}

describe('Catalogs Repositories Contract Tests (RC-018, RC-050, RC-055)', () => {
  const realPrisma = new PrismaService();
  const fixedNow = new Date('2026-10-15T10:00:00.000Z');

  beforeAll(async () => {
    await realPrisma.$connect();
  });

  afterAll(async () => {
    await cleanDb();
    await realPrisma.$disconnect();
  });

  const cleanDb = async () => {
    await realPrisma.patientProcedurePrice.deleteMany();
    await realPrisma.procedure.deleteMany();
    await realPrisma.material.deleteMany();
    await realPrisma.patient.deleteMany();
    await realPrisma.refreshSession.deleteMany();
    await realPrisma.user.deleteMany();
    await realPrisma.clinic.deleteMany();
  };

  const ensurePrerequisites = async () => {
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-cat-1' },
      create: { id: 'clinic-cat-1', name: 'Clínica Cat 1' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-cat-2' },
      create: { id: 'clinic-cat-2', name: 'Clínica Cat 2' },
      update: {},
    });
    await realPrisma.patient.upsert({
      where: { id: 'patient-cat-1' },
      create: {
        id: 'patient-cat-1',
        clinicId: 'clinic-cat-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: 'CC',
        documentNumber: '111222333',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        phone: '3001234567',
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      update: {},
    });
  };

  const inMemoryProcedureRepo = new InMemoryProcedureRepository();
  const inMemoryPriceRepo = new InMemoryPatientProcedurePriceRepository();
  const inMemoryMaterialRepo = new InMemoryMaterialRepository();

  const prismaProcedureRepo = new PrismaProcedureRepository(realPrisma);
  const prismaPriceRepo = new PrismaPatientProcedurePriceRepository(realPrisma);
  const prismaMaterialRepo = new PrismaMaterialRepository(realPrisma);

  const factories: CatalogsRepositoryFactory[] = [
    {
      name: 'InMemoryRepositories',
      createRepos: () => ({
        procedureRepo: inMemoryProcedureRepo,
        patientPriceRepo: inMemoryPriceRepo,
        materialRepo: inMemoryMaterialRepo,
        cleanup: async () => {
          inMemoryProcedureRepo.clear();
          inMemoryPriceRepo.clear();
          inMemoryMaterialRepo.clear();
        },
      }),
    },
    {
      name: 'PrismaRepositories',
      createRepos: () => ({
        procedureRepo: prismaProcedureRepo,
        patientPriceRepo: prismaPriceRepo,
        materialRepo: prismaMaterialRepo,
        cleanup: async () => {
          await cleanDb();
          await ensurePrerequisites();
        },
      }),
    },
  ];

  factories.forEach(({ name, createRepos }) => {
    describe(`Factory: ${name}`, () => {
      let procedureRepo: ProcedureRepositoryPort;
      let patientPriceRepo: PatientProcedurePriceRepositoryPort;
      let materialRepo: MaterialRepositoryPort;
      let cleanup: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        const instance = createRepos();
        procedureRepo = instance.procedureRepo;
        patientPriceRepo = instance.patientPriceRepo;
        materialRepo = instance.materialRepo;
        cleanup = instance.cleanup;
        if (cleanup) {
          await cleanup();
        }
      });

      afterEach(async () => {
        if (cleanup) {
          await cleanup();
        }
      });

      describe('ProcedureRepositoryPort', () => {
        it('should save and find a procedure by id', async () => {
          const procedure = Procedure.create({
            id: 'proc-1',
            clinicId: 'clinic-cat-1',
            code: 'PROC-01',
            name: 'Limpieza dental',
            description: 'Profilaxis general',
            basePrice: Money.from(80000),
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await procedureRepo.save(procedure);

          const found = await procedureRepo.findById('clinic-cat-1', 'proc-1');
          expect(found).not.toBeNull();
          expect(found?.id).toBe('proc-1');
          expect(found?.clinicId).toBe('clinic-cat-1');
          expect(found?.code).toBe('PROC-01');
          expect(found?.name).toBe('Limpieza dental');
          expect(found?.basePrice.amount).toBe(80000);
        });

        it('should find procedure by normalized code', async () => {
          const procedure = Procedure.create({
            id: 'proc-2',
            clinicId: 'clinic-cat-1',
            code: 'EXTR-01',
            name: 'Extracción simple',
            basePrice: Money.from(120000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await procedureRepo.save(procedure);

          const found = await procedureRepo.findByCode('clinic-cat-1', 'extr-01');
          expect(found).not.toBeNull();
          expect(found?.id).toBe('proc-2');
          expect(found?.code).toBe('EXTR-01');
        });

        it('should return null when procedure is not found', async () => {
          const notFound = await procedureRepo.findById('clinic-cat-1', 'non-existent');
          expect(notFound).toBeNull();

          const notFoundCode = await procedureRepo.findByCode('clinic-cat-1', 'UNKNOWN');
          expect(notFoundCode).toBeNull();
        });

        it('should list procedures and filter by includeInactive', async () => {
          const p1 = Procedure.create({
            id: 'p-active',
            clinicId: 'clinic-cat-1',
            code: 'ACT-01',
            name: 'Activo',
            basePrice: Money.from(50000),
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const p2 = Procedure.create({
            id: 'p-inactive',
            clinicId: 'clinic-cat-1',
            code: 'INACT-01',
            name: 'Inactivo',
            basePrice: Money.from(60000),
            isActive: false,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await procedureRepo.save(p1);
          await procedureRepo.save(p2);

          const activeOnly = await procedureRepo.findAllByClinicId('clinic-cat-1', false);
          expect(activeOnly).toHaveLength(1);
          expect(activeOnly[0].id).toBe('p-active');

          const all = await procedureRepo.findAllByClinicId('clinic-cat-1', true);
          expect(all).toHaveLength(2);
        });

        it('should isolate procedures by clinicId', async () => {
          const p1 = Procedure.create({
            id: 'p-clinic-1',
            clinicId: 'clinic-cat-1',
            code: 'CODE-ISO',
            name: 'Proc 1',
            basePrice: Money.from(50000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const p2 = Procedure.create({
            id: 'p-clinic-2',
            clinicId: 'clinic-cat-2',
            code: 'CODE-ISO',
            name: 'Proc 2',
            basePrice: Money.from(50000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await procedureRepo.save(p1);
          await procedureRepo.save(p2);

          const list1 = await procedureRepo.findAllByClinicId('clinic-cat-1', true);
          expect(list1).toHaveLength(1);
          expect(list1[0].id).toBe('p-clinic-1');

          const foundIn1 = await procedureRepo.findByCode('clinic-cat-1', 'CODE-ISO');
          expect(foundIn1?.id).toBe('p-clinic-1');

          const foundIn2 = await procedureRepo.findByCode('clinic-cat-2', 'CODE-ISO');
          expect(foundIn2?.id).toBe('p-clinic-2');
        });

        it('should throw DuplicateProcedureCodeError on duplicate code in same clinic', async () => {
          const p1 = Procedure.create({
            id: 'p-dup-1',
            clinicId: 'clinic-cat-1',
            code: 'DUP-01',
            name: 'Proc A',
            basePrice: Money.from(50000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const p2 = Procedure.create({
            id: 'p-dup-2',
            clinicId: 'clinic-cat-1',
            code: 'DUP-01',
            name: 'Proc B',
            basePrice: Money.from(70000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await procedureRepo.save(p1);
          await expect(procedureRepo.save(p2)).rejects.toThrow(DuplicateProcedureCodeError);
        });
      });

      describe('PatientProcedurePriceRepositoryPort', () => {
        it('should save and find patient custom price', async () => {
          const proc = Procedure.create({
            id: 'proc-for-price',
            clinicId: 'clinic-cat-1',
            code: 'PRIC-01',
            name: 'Procedimiento de prueba',
            basePrice: Money.from(100000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          await procedureRepo.save(proc);

          const customPrice = PatientProcedurePrice.create({
            id: 'price-1',
            clinicId: 'clinic-cat-1',
            patientId: 'patient-cat-1',
            procedureId: 'proc-for-price',
            customPrice: Money.from(75000),
            reason: 'Descuento paciente frecuente',
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await patientPriceRepo.save(customPrice);

          const found = await patientPriceRepo.findByPatientAndProcedure(
            'clinic-cat-1',
            'patient-cat-1',
            'proc-for-price',
          );

          expect(found).not.toBeNull();
          expect(found?.customPrice.amount).toBe(75000);
          expect(found?.reason).toBe('Descuento paciente frecuente');
        });

        it('should list all custom prices for a patient', async () => {
          const proc1 = Procedure.create({
            id: 'proc-list-1',
            clinicId: 'clinic-cat-1',
            code: 'PL-01',
            name: 'Proc 1',
            basePrice: Money.from(100000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const proc2 = Procedure.create({
            id: 'proc-list-2',
            clinicId: 'clinic-cat-1',
            code: 'PL-02',
            name: 'Proc 2',
            basePrice: Money.from(200000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          await procedureRepo.save(proc1);
          await procedureRepo.save(proc2);

          const cp1 = PatientProcedurePrice.create({
            id: 'cp-1',
            clinicId: 'clinic-cat-1',
            patientId: 'patient-cat-1',
            procedureId: 'proc-list-1',
            customPrice: Money.from(90000),
            reason: 'Convenio',
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const cp2 = PatientProcedurePrice.create({
            id: 'cp-2',
            clinicId: 'clinic-cat-1',
            patientId: 'patient-cat-1',
            procedureId: 'proc-list-2',
            customPrice: Money.from(180000),
            reason: 'Convenio familiar',
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await patientPriceRepo.save(cp1);
          await patientPriceRepo.save(cp2);

          const list = await patientPriceRepo.findAllByPatient('clinic-cat-1', 'patient-cat-1');
          expect(list).toHaveLength(2);
        });

        it('should update price when saved with same id', async () => {
          const proc = Procedure.create({
            id: 'proc-up-price',
            clinicId: 'clinic-cat-1',
            code: 'PUP-01',
            name: 'Proc Update',
            basePrice: Money.from(100000),
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          await procedureRepo.save(proc);

          const initial = PatientProcedurePrice.create({
            id: 'price-update-1',
            clinicId: 'clinic-cat-1',
            patientId: 'patient-cat-1',
            procedureId: 'proc-up-price',
            customPrice: Money.from(80000),
            reason: 'Inicial',
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          await patientPriceRepo.save(initial);

          const updated = PatientProcedurePrice.create({
            id: 'price-update-1',
            clinicId: 'clinic-cat-1',
            patientId: 'patient-cat-1',
            procedureId: 'proc-up-price',
            customPrice: Money.from(70000),
            reason: 'Actualizado',
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          await patientPriceRepo.save(updated);

          const found = await patientPriceRepo.findByPatientAndProcedure(
            'clinic-cat-1',
            'patient-cat-1',
            'proc-up-price',
          );
          expect(found?.customPrice.amount).toBe(70000);
          expect(found?.reason).toBe('Actualizado');
        });
      });

      describe('MaterialRepositoryPort', () => {
        it('should save and find material by id', async () => {
          const material = Material.create({
            id: 'mat-1',
            clinicId: 'clinic-cat-1',
            brand: '3M',
            reference: 'Filtek Z350',
            type: 'Resina',
            color: 'A2',
            currentStock: 10,
            minStock: 2,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await materialRepo.save(material);

          const found = await materialRepo.findById('clinic-cat-1', 'mat-1');
          expect(found).not.toBeNull();
          expect(found?.id).toBe('mat-1');
          expect(found?.brand).toBe('3M');
          expect(found?.currentStock).toBe(10);
          expect(found?.isLowStock).toBe(false);
        });

        it('should find material by natural key (brand, reference, color)', async () => {
          const material = Material.create({
            id: 'mat-cat-find',
            clinicId: 'clinic-cat-1',
            brand: 'Top Glove',
            reference: 'TG-100',
            type: 'Guantes',
            color: 'Blanco',
            currentStock: 15,
            minStock: 5,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await materialRepo.save(material);

          const found = await materialRepo.findByNaturalKey(
            'clinic-cat-1',
            'Top Glove',
            'TG-100',
            'Blanco',
          );
          expect(found).not.toBeNull();
          expect(found?.id).toBe('mat-cat-find');
        });

        it('should list materials and filter by includeInactive', async () => {
          const normalStock = Material.create({
            id: 'mat-norm',
            clinicId: 'clinic-cat-1',
            brand: 'BrandA',
            reference: 'RefA',
            type: 'TipoA',
            color: 'ColorA',
            currentStock: 10,
            minStock: 3,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const inactiveStock = Material.create({
            id: 'mat-inact',
            clinicId: 'clinic-cat-1',
            brand: 'BrandB',
            reference: 'RefB',
            type: 'TipoB',
            color: 'ColorB',
            currentStock: 2,
            minStock: 5,
            isActive: false,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await materialRepo.save(normalStock);
          await materialRepo.save(inactiveStock);

          const activeOnly = await materialRepo.findAllByClinicId('clinic-cat-1', false);
          expect(activeOnly).toHaveLength(1);
          expect(activeOnly[0].id).toBe('mat-norm');

          const all = await materialRepo.findAllByClinicId('clinic-cat-1', true);
          expect(all).toHaveLength(2);
        });

        it('should isolate materials by clinicId', async () => {
          const m1 = Material.create({
            id: 'mat-c1',
            clinicId: 'clinic-cat-1',
            brand: 'SameBrand',
            reference: 'SameRef',
            type: 'TipoSame',
            color: 'SameColor',
            currentStock: 5,
            minStock: 1,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const m2 = Material.create({
            id: 'mat-c2',
            clinicId: 'clinic-cat-2',
            brand: 'SameBrand',
            reference: 'SameRef',
            type: 'TipoSame',
            color: 'SameColor',
            currentStock: 8,
            minStock: 2,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await materialRepo.save(m1);
          await materialRepo.save(m2);

          const list1 = await materialRepo.findAllByClinicId('clinic-cat-1', true);
          expect(list1).toHaveLength(1);
          expect(list1[0].id).toBe('mat-c1');

          const foundIn1 = await materialRepo.findByNaturalKey(
            'clinic-cat-1',
            'SameBrand',
            'SameRef',
            'SameColor',
          );
          expect(foundIn1?.id).toBe('mat-c1');

          const foundIn2 = await materialRepo.findByNaturalKey(
            'clinic-cat-2',
            'SameBrand',
            'SameRef',
            'SameColor',
          );
          expect(foundIn2?.id).toBe('mat-c2');
        });

        it('should throw DuplicateMaterialCatalogError on duplicate catalog in same clinic', async () => {
          const m1 = Material.create({
            id: 'mat-dup-1',
            clinicId: 'clinic-cat-1',
            brand: 'BrandDup',
            reference: 'RefDup',
            type: 'TipoDup',
            color: 'ColorDup',
            currentStock: 5,
            minStock: 1,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          const m2 = Material.create({
            id: 'mat-dup-2',
            clinicId: 'clinic-cat-1',
            brand: 'BrandDup',
            reference: 'RefDup',
            type: 'TipoDup',
            color: 'ColorDup',
            currentStock: 8,
            minStock: 2,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });

          await materialRepo.save(m1);
          await expect(materialRepo.save(m2)).rejects.toThrow(DuplicateMaterialCatalogError);
        });
      });
    });
  });

  describe('PostgreSQL Real onDelete: Restrict checks (RC-055)', () => {
    beforeEach(async () => {
      await cleanDb();
      await ensurePrerequisites();
    });

    it('should reject deleting a Clinic when it has a Procedure (onDelete: Restrict)', async () => {
      await realPrisma.procedure.create({
        data: {
          id: 'proc-restrict-test',
          clinicId: 'clinic-cat-1',
          code: 'REST-01',
          name: 'Proc Restrict',
          basePriceCop: 50000,
        },
      });

      await expect(
        realPrisma.clinic.delete({
          where: { id: 'clinic-cat-1' },
        }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });

    it('should reject deleting a Clinic when it has a Material (onDelete: Restrict)', async () => {
      await realPrisma.material.create({
        data: {
          id: 'mat-restrict-test',
          clinicId: 'clinic-cat-1',
          brand: 'BrandRest',
          reference: 'RefRest',
          type: 'Resina',
          color: 'ColorRest',
          currentStock: 5,
          minStock: 1,
        },
      });

      await expect(
        realPrisma.clinic.delete({
          where: { id: 'clinic-cat-1' },
        }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });

    it('should reject deleting a Patient when it has a PatientProcedurePrice (onDelete: Restrict)', async () => {
      await realPrisma.procedure.create({
        data: {
          id: 'proc-for-ppp',
          clinicId: 'clinic-cat-1',
          code: 'PPP-01',
          name: 'Proc PPP',
          basePriceCop: 50000,
        },
      });

      await realPrisma.patientProcedurePrice.create({
        data: {
          id: 'ppp-restrict-test',
          clinicId: 'clinic-cat-1',
          patientId: 'patient-cat-1',
          procedureId: 'proc-for-ppp',
          customPriceCop: 40000,
          reason: 'Prueba restrict',
        },
      });

      await expect(
        realPrisma.patient.delete({
          where: { id: 'patient-cat-1' },
        }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });

    it('should reject deleting a Procedure when it has a PatientProcedurePrice (onDelete: Restrict)', async () => {
      await realPrisma.procedure.create({
        data: {
          id: 'proc-for-ppp-2',
          clinicId: 'clinic-cat-1',
          code: 'PPP-02',
          name: 'Proc PPP 2',
          basePriceCop: 50000,
        },
      });

      await realPrisma.patientProcedurePrice.create({
        data: {
          id: 'ppp-restrict-test-2',
          clinicId: 'clinic-cat-1',
          patientId: 'patient-cat-1',
          procedureId: 'proc-for-ppp-2',
          customPriceCop: 40000,
          reason: 'Prueba restrict 2',
        },
      });

      await expect(
        realPrisma.procedure.delete({
          where: { id: 'proc-for-ppp-2' },
        }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    });
  });
});
