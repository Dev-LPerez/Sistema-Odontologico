import { Clinic } from '../../domain/clinic.entity';
import { User } from '../../domain/user.entity';
import { RefreshSession } from '../../domain/refresh-session.entity';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';
import { ClinicRepositoryPort } from '../../domain/clinic.repository.port';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { RefreshSessionRepositoryPort } from '../../domain/refresh-session.repository.port';
import { InMemoryClinicRepository } from './in-memory-clinic.repository';
import { InMemoryUserRepository } from './in-memory-user.repository';
import { InMemoryRefreshSessionRepository } from './in-memory-refresh-session.repository';
import { PrismaClinicRepository } from './prisma-clinic.repository';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaRefreshSessionRepository } from './prisma-refresh-session.repository';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { DuplicateUserEmailError } from '../../domain/identity.errors';

interface RepositoryFactory {
  name: string;
  createClinicRepo: () => { repo: ClinicRepositoryPort; cleanup?: () => Promise<void> };
  createUserRepo: () => { repo: UserRepositoryPort; cleanup?: () => Promise<void> };
  createRefreshSessionRepo: () => {
    repo: RefreshSessionRepositoryPort;
    cleanup?: () => Promise<void>;
  };
}

describe('Identity Repositories Contract Tests (RC-018)', () => {
  const realPrisma = new PrismaService();

  beforeAll(async () => {
    await realPrisma.$connect();
  });

  afterAll(async () => {
    await cleanDb();
    await realPrisma.$disconnect();
  });

  const cleanDb = async () => {
    await realPrisma.treatmentPlanItem.deleteMany();
    await realPrisma.clinicalHistory.deleteMany();
    await realPrisma.patientProcedurePrice.deleteMany();
    await realPrisma.procedure.deleteMany();
    await realPrisma.material.deleteMany();
    await realPrisma.patient.deleteMany();
    await realPrisma.refreshSession.deleteMany();
    await realPrisma.user.deleteMany();
    await realPrisma.clinic.deleteMany();
  };

  const implementations: RepositoryFactory[] = [
    {
      name: 'InMemoryRepositories',
      createClinicRepo: () => ({ repo: new InMemoryClinicRepository() }),
      createUserRepo: () => ({ repo: new InMemoryUserRepository() }),
      createRefreshSessionRepo: () => ({ repo: new InMemoryRefreshSessionRepository() }),
    },
    {
      name: 'PrismaRepositories',
      createClinicRepo: () => ({
        repo: new PrismaClinicRepository(realPrisma),
        cleanup: cleanDb,
      }),
      createUserRepo: () => ({
        repo: new PrismaUserRepository(realPrisma),
        cleanup: cleanDb,
      }),
      createRefreshSessionRepo: () => ({
        repo: new PrismaRefreshSessionRepository(realPrisma),
        cleanup: cleanDb,
      }),
    },
  ];

  implementations.forEach(
    ({ name, createClinicRepo, createUserRepo, createRefreshSessionRepo }) => {
      describe(`${name} - Contrato ClinicRepositoryPort`, () => {
        let repo: ClinicRepositoryPort;

        beforeEach(async () => {
          const factory = createClinicRepo();
          if (factory.cleanup) {
            await factory.cleanup();
          }
          repo = factory.repo;
        });

        it('debe guardar una clínica y recuperarla por su id', async () => {
          const now = new Date('2026-10-13T10:00:00.000Z');
          const clinic = Clinic.create({
            id: 'clinic-c1',
            name: 'Consultorio Dental Dra. María',
            address: 'Calle 100 # 15-20',
            phone: '+573001234567',
            email: 'contacto@dramaria.com',
            logoUrl: 'https://r2.storage.com/logo.png',
            settings: { timezone: 'America/Bogota' },
            createdAt: now,
            updatedAt: now,
          });

          await repo.save(clinic);

          const found = await repo.findById('clinic-c1');
          expect(found).not.toBeNull();
          expect(found?.id).toBe('clinic-c1');
          expect(found?.name).toBe('Consultorio Dental Dra. María');
          expect(found?.address).toBe('Calle 100 # 15-20');
          expect(found?.phone).toBe('+573001234567');
          expect(found?.email).toBe('contacto@dramaria.com');
          expect(found?.settings).toEqual({ timezone: 'America/Bogota' });
        });

        it('debe retornar null cuando la clínica no existe', async () => {
          const found = await repo.findById('non-existent-clinic');
          expect(found).toBeNull();
        });
      });

      describe(`${name} - Contrato UserRepositoryPort`, () => {
        let repo: UserRepositoryPort;
        let clinicRepo: ClinicRepositoryPort;

        beforeEach(async () => {
          const userFactory = createUserRepo();
          if (userFactory.cleanup) {
            await userFactory.cleanup();
          }
          repo = userFactory.repo;
          clinicRepo = createClinicRepo().repo;

          // Prerrequisitos de clínica para claves foráneas reales
          const now = new Date('2026-10-13T10:00:00.000Z');
          await clinicRepo.save(
            Clinic.create({ id: 'clinic-c1', name: 'Clínica C1', createdAt: now, updatedAt: now }),
          );
          await clinicRepo.save(
            Clinic.create({
              id: 'clinic-tenant-1',
              name: 'Clínica Tenant 1',
              createdAt: now,
              updatedAt: now,
            }),
          );
          await clinicRepo.save(
            Clinic.create({
              id: 'clinic-tenant-2',
              name: 'Clínica Tenant 2',
              createdAt: now,
              updatedAt: now,
            }),
          );
        });

        it('debe guardar un usuario y recuperarlo por su id con clinicId', async () => {
          const now = new Date('2026-10-13T10:00:00.000Z');
          const user = User.create({
            id: 'user-u1',
            clinicId: 'clinic-c1',
            email: Email.create('doctora@clinica.com'),
            passwordHash: '$argon2id$hashed',
            fullName: 'Dra. María Pérez',
            role: UserRole.ADMIN,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          await repo.save(user);

          const found = await repo.findById('clinic-c1', 'user-u1');
          expect(found).not.toBeNull();
          expect(found?.id).toBe('user-u1');
          expect(found?.clinicId).toBe('clinic-c1');
          expect(found?.email.value).toBe('doctora@clinica.com');
          expect(found?.role).toBe(UserRole.ADMIN);
          expect(found?.fullName).toBe('Dra. María Pérez');

          const crossClinicFound = await repo.findById('other-clinic-c2', 'user-u1');
          expect(crossClinicFound).toBeNull();
        });

        it('debe encontrar el usuario por Email VO', async () => {
          const now = new Date('2026-10-13T10:00:00.000Z');
          const user = User.create({
            id: 'user-u2',
            clinicId: 'clinic-c1',
            email: Email.create('auxiliar@clinica.com'),
            passwordHash: '$argon2id$hashed',
            fullName: 'Laura Gómez',
            role: UserRole.AUXILIARY,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          await repo.save(user);

          const found = await repo.findByEmail(Email.create('auxiliar@clinica.com'));
          expect(found).not.toBeNull();
          expect(found?.id).toBe('user-u2');
          expect(found?.role).toBe(UserRole.AUXILIARY);

          const notFound = await repo.findByEmail(Email.create('desconocido@clinica.com'));
          expect(notFound).toBeNull();
        });

        it('debe listar todos los usuarios pertenecientes al clinicId garantizando aislamiento multitenant (RNF-B-032, RC-018)', async () => {
          const now = new Date('2026-10-13T10:00:00.000Z');
          const userClinic1A = User.create({
            id: 'user-c1-a',
            clinicId: 'clinic-tenant-1',
            email: Email.create('admin@tenant1.com'),
            passwordHash: 'hash-1',
            fullName: 'Dra. Tenant 1',
            role: UserRole.ADMIN,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
          const userClinic1B = User.create({
            id: 'user-c1-b',
            clinicId: 'clinic-tenant-1',
            email: Email.create('aux@tenant1.com'),
            passwordHash: 'hash-2',
            fullName: 'Auxiliar Tenant 1',
            role: UserRole.AUXILIARY,
            isActive: true,
            createdAt: new Date('2026-10-13T11:00:00.000Z'),
            updatedAt: new Date('2026-10-13T11:00:00.000Z'),
          });
          const userClinic2 = User.create({
            id: 'user-c2',
            clinicId: 'clinic-tenant-2',
            email: Email.create('admin@tenant2.com'),
            passwordHash: 'hash-3',
            fullName: 'Dra. Tenant 2',
            role: UserRole.ADMIN,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          await repo.save(userClinic1A);
          await repo.save(userClinic1B);
          await repo.save(userClinic2);

          const tenant1Users = await repo.findAllByClinicId('clinic-tenant-1');
          expect(tenant1Users).toHaveLength(2);
          const tenant1Ids = tenant1Users.map((u) => u.id);
          expect(tenant1Ids).toContain('user-c1-a');
          expect(tenant1Ids).toContain('user-c1-b');
          expect(tenant1Ids).not.toContain('user-c2');

          const tenant2Users = await repo.findAllByClinicId('clinic-tenant-2');
          expect(tenant2Users).toHaveLength(1);
          expect(tenant2Users[0].id).toBe('user-c2');

          const emptyTenantUsers = await repo.findAllByClinicId('clinic-sin-usuarios');
          expect(emptyTenantUsers).toEqual([]);
        });

        it('debe lanzar DuplicateUserEmailError (409) cuando se intenta registrar un correo ya existente (P2002)', async () => {
          const now = new Date('2026-10-13T10:00:00.000Z');
          const user1 = User.create({
            id: 'user-uniq-1',
            clinicId: 'clinic-c1',
            email: Email.create('duplicado@clinica.com'),
            passwordHash: 'hash-1',
            fullName: 'Usuario Uno',
            role: UserRole.ADMIN,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
          const user2 = User.create({
            id: 'user-uniq-2',
            clinicId: 'clinic-c1',
            email: Email.create('duplicado@clinica.com'),
            passwordHash: 'hash-2',
            fullName: 'Usuario Dos',
            role: UserRole.AUXILIARY,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          await repo.save(user1);
          await expect(repo.save(user2)).rejects.toThrow(DuplicateUserEmailError);
        });
      });

      describe(`${name} - Contrato RefreshSessionRepositoryPort`, () => {
        let repo: RefreshSessionRepositoryPort;
        let userRepo: UserRepositoryPort;
        let clinicRepo: ClinicRepositoryPort;

        beforeEach(async () => {
          const sessionFactory = createRefreshSessionRepo();
          if (sessionFactory.cleanup) {
            await sessionFactory.cleanup();
          }
          repo = sessionFactory.repo;
          clinicRepo = createClinicRepo().repo;
          userRepo = createUserRepo().repo;

          // Prerrequisitos de clínica y usuario para claves foráneas reales
          const now = new Date('2026-10-13T10:00:00.000Z');
          await clinicRepo.save(
            Clinic.create({ id: 'clinic-c1', name: 'Clínica C1', createdAt: now, updatedAt: now }),
          );
          await userRepo.save(
            User.create({
              id: 'user-u1',
              clinicId: 'clinic-c1',
              email: Email.create('sess-user@clinica.com'),
              passwordHash: 'hash',
              fullName: 'Usuario Sesión',
              role: UserRole.ADMIN,
              isActive: true,
              createdAt: now,
              updatedAt: now,
            }),
          );
        });

        it('debe guardar y encontrar una sesión por su tokenHash', async () => {
          const now = new Date('2026-10-13T10:00:00.000Z');
          const session = RefreshSession.create({
            id: 'sess-s1',
            clinicId: 'clinic-c1',
            userId: 'user-u1',
            tokenHash: 'sha256-hash-token-12345',
            expiresAt: new Date('2026-10-20T10:00:00.000Z'),
            createdAt: now,
          });

          await repo.save(session);

          const found = await repo.findByTokenHash('sha256-hash-token-12345');
          expect(found).not.toBeNull();
          expect(found?.id).toBe('sess-s1');
          expect(found?.userId).toBe('user-u1');
          expect(found?.clinicId).toBe('clinic-c1');
          expect(found?.isRevoked()).toBe(false);
        });

        it('debe revocar todas las sesiones activas de un usuario', async () => {
          const now = new Date('2026-10-13T10:00:00.000Z');
          const session1 = RefreshSession.create({
            id: 'sess-s1',
            clinicId: 'clinic-c1',
            userId: 'user-u1',
            tokenHash: 'hash-s1',
            expiresAt: new Date('2026-10-20T10:00:00.000Z'),
            createdAt: now,
          });
          const session2 = RefreshSession.create({
            id: 'sess-s2',
            clinicId: 'clinic-c1',
            userId: 'user-u1',
            tokenHash: 'hash-s2',
            expiresAt: new Date('2026-10-20T10:00:00.000Z'),
            createdAt: now,
          });

          await repo.save(session1);
          await repo.save(session2);

          const revokedAt = new Date('2026-10-13T12:00:00.000Z');
          await repo.revokeAllForUser('user-u1', revokedAt);

          const found1 = await repo.findByTokenHash('hash-s1');
          const found2 = await repo.findByTokenHash('hash-s2');

          expect(found1?.isRevoked()).toBe(true);
          expect(found2?.isRevoked()).toBe(true);
        });
      });
    },
  );
});
