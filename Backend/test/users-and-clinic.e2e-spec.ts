import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { CLINIC_REPOSITORY_PORT } from '../src/modules/identity/domain/clinic.repository.port';
import { USER_REPOSITORY_PORT } from '../src/modules/identity/domain/user.repository.port';
import { REFRESH_SESSION_REPOSITORY_PORT } from '../src/modules/identity/domain/refresh-session.repository.port';
import { UNIT_OF_WORK_PORT } from '../src/shared/application/ports/unit-of-work.port';
import { InMemoryClinicRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-clinic.repository';
import { InMemoryUserRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-user.repository';
import { InMemoryRefreshSessionRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-refresh-session.repository';
import {
  PasswordHasherPort,
  PASSWORD_HASHER_PORT,
} from '../src/modules/identity/application/ports/password-hasher.port';
import { Clinic } from '../src/modules/identity/domain/clinic.entity';
import { User } from '../src/modules/identity/domain/user.entity';
import { Email } from '../src/modules/identity/domain/email.vo';
import { UserRole } from '../src/modules/identity/domain/role.enum';
import { RefreshSession } from '../src/modules/identity/domain/refresh-session.entity';

describe('Users and Clinic Management (e2e) (RF-B-003, RF-B-141, RC-005)', () => {
  let app: INestApplication;
  let clinicRepo: InMemoryClinicRepository;
  let userRepo: InMemoryUserRepository;
  let refreshSessionRepo: InMemoryRefreshSessionRepository;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'clinic-uuid-mgmt-001';
  const adminId = 'user-uuid-admin-mgmt-001';
  const auxiliaryId = 'user-uuid-aux-mgmt-002';
  const rawPassword = 'Password123!';

  let adminAccessToken: string;
  let auxiliaryAccessToken: string;

  beforeAll(async () => {
    clinicRepo = new InMemoryClinicRepository();
    userRepo = new InMemoryUserRepository();
    refreshSessionRepo = new InMemoryRefreshSessionRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CLINIC_REPOSITORY_PORT)
      .useValue(clinicRepo)
      .overrideProvider(USER_REPOSITORY_PORT)
      .useValue(userRepo)
      .overrideProvider(REFRESH_SESSION_REPOSITORY_PORT)
      .useValue(refreshSessionRepo)
      .overrideProvider(UNIT_OF_WORK_PORT)
      .useValue({
        execute: async <T>(work: () => Promise<T>): Promise<T> => work(),
      })
      .compile();

    passwordHasher = moduleFixture.get<PasswordHasherPort>(PASSWORD_HASHER_PORT);

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    // Seeding inicial de consultorio y usuarios
    const now = new Date('2026-10-13T10:00:00.000Z');
    const clinic = Clinic.create({
      id: testClinicId,
      name: 'Consultorio Dra. Angelee Pacheco',
      address: 'Calle 100 # 15-20',
      phone: '+573001234567',
      email: 'contacto@draangelee.com',
      logoUrl: 'https://r2.draangelee.com/logo.png',
      settings: { timezone: 'America/Bogota' },
      createdAt: now,
      updatedAt: now,
    });
    await clinicRepo.save(clinic);

    const hashedPwd = await passwordHasher.hash(rawPassword);

    const adminUser = User.create({
      id: adminId,
      clinicId: testClinicId,
      email: Email.create('admin.mgmt@clinica.com'),
      passwordHash: hashedPwd,
      fullName: 'Dra. Administradora',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await userRepo.save(adminUser);

    const auxiliaryUser = User.create({
      id: auxiliaryId,
      clinicId: testClinicId,
      email: Email.create('auxiliar.mgmt@clinica.com'),
      passwordHash: hashedPwd,
      fullName: 'Carlos Auxiliar',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await userRepo.save(auxiliaryUser);

    // Obtener tokens de autenticación para ADMIN y AUXILIARY
    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin.mgmt@clinica.com', password: rawPassword })
      .expect(200);
    adminAccessToken = adminLoginRes.body.accessToken;

    const auxLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'auxiliar.mgmt@clinica.com', password: rawPassword })
      .expect(200);
    auxiliaryAccessToken = auxLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Users Management (/v1/users) (RF-B-003, RC-005)', () => {
    let createdUserId: string;

    it('debe rechazar la petición si no se envía token de autenticación (401)', async () => {
      await request(app.getHttpServer()).get('/v1/users').expect(401);
    });

    it('debe rechazar listar usuarios al rol AUXILIARY con 403 Forbidden (RC-005)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(403);

      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('debe rechazar crear usuario al rol AUXILIARY con 403 Forbidden (RC-005)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          email: 'intruso@clinica.com',
          password: 'Password123!',
          fullName: 'Intruso',
          role: 'AUXILIARY',
        })
        .expect(403);

      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('debe permitir a ADMIN crear un nuevo usuario exitosamente (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: 'nueva.auxiliar@clinica.com',
          password: 'Password123!',
          fullName: 'Mariana López',
          role: 'AUXILIARY',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.clinicId).toBe(testClinicId);
      expect(res.body.email).toBe('nueva.auxiliar@clinica.com');
      expect(res.body.fullName).toBe('Mariana López');
      expect(res.body.role).toBe(UserRole.AUXILIARY);
      expect(res.body.isActive).toBe(true);
      expect(res.body.passwordHash).toBeUndefined();

      createdUserId = res.body.id;
    });

    it('debe rechazar la creación de un usuario con correo ya registrado (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: 'nueva.auxiliar@clinica.com',
          password: 'OtherPassword123!',
          fullName: 'Otra Persona',
          role: 'AUXILIARY',
        })
        .expect(409);

      expect(res.body.errorCode).toBe('DUPLICATE_USER_EMAIL');
    });

    it('debe permitir a ADMIN listar todos los usuarios del consultorio (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);

      const emails = res.body.map((u: { email: string }) => u.email);
      expect(emails).toContain('admin.mgmt@clinica.com');
      expect(emails).toContain('auxiliar.mgmt@clinica.com');
      expect(emails).toContain('nueva.auxiliar@clinica.com');

      res.body.forEach((u: Record<string, unknown>) => {
        expect(u.passwordHash).toBeUndefined();
      });
    });

    it('debe permitir a ADMIN actualizar perfil de un usuario (200)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          fullName: 'Mariana López Actualizada',
          role: 'ADMIN',
        })
        .expect(200);

      expect(res.body.id).toBe(createdUserId);
      expect(res.body.fullName).toBe('Mariana López Actualizada');
      expect(res.body.role).toBe('ADMIN');
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('debe rechazar a ADMIN desactivarse a sí misma con 422 Unprocessable Entity', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ isActive: false })
        .expect(422);

      expect(res.body.errorCode).toBe('CANNOT_DEACTIVATE_SELF');
    });

    it('debe permitir a ADMIN desactivar otro usuario y revocar sus sesiones de refresco (200)', async () => {
      // Simular una sesión activa para el usuario a desactivar
      const now = new Date();
      const session = RefreshSession.create({
        id: 'session-target-aux',
        clinicId: testClinicId,
        userId: createdUserId,
        tokenHash: 'hash-session-target',
        expiresAt: new Date(Date.now() + 60000),
        createdAt: now,
      });

      await refreshSessionRepo.save(session);

      const res = await request(app.getHttpServer())
        .patch(`/v1/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.id).toBe(createdUserId);
      expect(res.body.isActive).toBe(false);

      // Verificar que la sesión quedó revocada en el repositorio
      const storedSession = await refreshSessionRepo.findByTokenHash('hash-session-target');
      expect(storedSession?.isRevoked()).toBe(true);
    });

    it('debe rechazar actualizar estado de usuario a rol AUXILIARY con 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ isActive: true })
        .expect(403);

      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('Clinic Management (/v1/clinic) (RF-B-141, RC-005)', () => {
    it('debe permitir a AUXILIARY consultar el perfil del consultorio (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/clinic')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(res.body.id).toBe(testClinicId);
      expect(res.body.name).toBe('Consultorio Dra. Angelee Pacheco');
      expect(res.body.email).toBe('contacto@draangelee.com');
      expect(res.body.settings).toEqual({ timezone: 'America/Bogota' });
    });

    it('debe permitir a ADMIN consultar el perfil del consultorio (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/clinic')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.id).toBe(testClinicId);
      expect(res.body.name).toBe('Consultorio Dra. Angelee Pacheco');
    });

    it('debe rechazar la modificación del consultorio al rol AUXILIARY con 403 Forbidden (RC-005)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/v1/clinic')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ name: 'Nombre No Autorizado' })
        .expect(403);

      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('debe permitir a ADMIN actualizar el perfil y configuración del consultorio (200)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/v1/clinic')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Clínica Dental Dra. Angelee Pacheco',
          phone: '+573109998877',
          settings: {
            timezone: 'America/Bogota',
            operatingHours: { weekdays: '08:00-18:00' },
          },
        })
        .expect(200);

      expect(res.body.id).toBe(testClinicId);
      expect(res.body.name).toBe('Clínica Dental Dra. Angelee Pacheco');
      expect(res.body.phone).toBe('+573109998877');
      expect(res.body.settings).toEqual({
        timezone: 'America/Bogota',
        operatingHours: { weekdays: '08:00-18:00' },
      });
    });

    it('debe rechazar actualizar consultorio con nombre vacío (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/v1/clinic')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: '   ' })
        .expect(400);

      expect(res.body.errorCode).toBe('INVALID_CLINIC_NAME');
    });
  });
});
