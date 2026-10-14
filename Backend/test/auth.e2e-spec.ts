import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/presentation/filters/domain-exception.filter';
import { CLINIC_REPOSITORY_PORT } from '../src/modules/identity/domain/clinic.repository.port';
import { USER_REPOSITORY_PORT } from '../src/modules/identity/domain/user.repository.port';
import { REFRESH_SESSION_REPOSITORY_PORT } from '../src/modules/identity/domain/refresh-session.repository.port';
import { InMemoryClinicRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-clinic.repository';
import { InMemoryUserRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-user.repository';
import { InMemoryRefreshSessionRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-refresh-session.repository';
import { PASSWORD_HASHER_PORT } from '../src/modules/identity/application/ports/password-hasher.port';
import { PasswordHasherPort } from '../src/modules/identity/application/ports/password-hasher.port';
import { Clinic } from '../src/modules/identity/domain/clinic.entity';
import { User } from '../src/modules/identity/domain/user.entity';
import { Email } from '../src/modules/identity/domain/email.vo';
import { UserRole } from '../src/modules/identity/domain/role.enum';

describe('Auth & Role Authorization (e2e) (RC-005)', () => {
  let app: INestApplication;
  let clinicRepo: InMemoryClinicRepository;
  let userRepo: InMemoryUserRepository;
  let refreshSessionRepo: InMemoryRefreshSessionRepository;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'clinic-uuid-001';
  const adminId = 'user-uuid-admin-001';
  const auxiliaryId = 'user-uuid-aux-002';
  const inactiveUserId = 'user-uuid-inactive-003';
  const rawPassword = 'Password123!';

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
      .compile();

    passwordHasher = moduleFixture.get<PasswordHasherPort>(PASSWORD_HASHER_PORT);

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('v1', { exclude: ['health', 'ready'] });
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Seeding inicial para pruebas
    const now = new Date();
    const clinic = Clinic.create({
      id: testClinicId,
      name: 'Clínica Odontológica Especializada',
      createdAt: now,
      updatedAt: now,
    });
    await clinicRepo.save(clinic);

    const hashedPwd = await passwordHasher.hash(rawPassword);

    const adminUser = User.create({
      id: adminId,
      clinicId: testClinicId,
      email: Email.create('admin@clinica.com'),
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
      email: Email.create('auxiliar@clinica.com'),
      passwordHash: hashedPwd,
      fullName: 'Carlos Auxiliar',
      role: UserRole.AUXILIARY,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await userRepo.save(auxiliaryUser);

    const inactiveUser = User.create({
      id: inactiveUserId,
      clinicId: testClinicId,
      email: Email.create('inactivo@clinica.com'),
      passwordHash: hashedPwd,
      fullName: 'Usuario Inactivo',
      role: UserRole.AUXILIARY,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
    await userRepo.save(inactiveUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    it('debe iniciar sesión exitosamente para ADMIN y retornar accessToken y Set-Cookie httpOnly', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'admin@clinica.com',
          password: rawPassword,
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toEqual({
        id: adminId,
        clinicId: testClinicId,
        email: 'admin@clinica.com',
        fullName: 'Dra. Administradora',
        role: 'ADMIN',
      });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = (cookies as unknown as string[]).find((c) =>
        c.startsWith('refresh_token='),
      );
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie?.toLowerCase()).toContain('httponly');
    });

    it('debe iniciar sesión exitosamente para AUXILIARY', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'auxiliar@clinica.com',
          password: rawPassword,
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.role).toBe('AUXILIARY');
    });

    it('debe rechazar con 401 si la contraseña es incorrecta', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'admin@clinica.com',
          password: 'WrongPassword999!',
        })
        .expect(401);

      expect(response.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('debe rechazar con 401 si el correo no existe', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'inexistente@clinica.com',
          password: rawPassword,
        })
        .expect(401);

      expect(response.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('debe rechazar con 401 si el usuario está inactivo', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'inactivo@clinica.com',
          password: rawPassword,
        })
        .expect(401);

      expect(response.body.errorCode).toBe('USER_INACTIVE');
    });

    it('debe rechazar con 400 si el payload es inválido', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('POST /v1/auth/refresh y POST /v1/auth/logout', () => {
    let refreshCookieHeader: string;

    beforeEach(async () => {
      const loginRes = await request(app.getHttpServer()).post('/v1/auth/login').send({
        email: 'admin@clinica.com',
        password: rawPassword,
      });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      refreshCookieHeader = cookies.find((c) => c.startsWith('refresh_token=')) || '';
    });

    it('debe renovar el accessToken y rotar el refreshToken desde la cookie httpOnly', async () => {
      const refreshRes = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .set('Cookie', [refreshCookieHeader])
        .expect(200);

      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.user.email).toBe('admin@clinica.com');

      const newCookies = refreshRes.headers['set-cookie'] as unknown as string[];
      const newRefreshCookie = newCookies.find((c) => c.startsWith('refresh_token='));
      expect(newRefreshCookie).toBeDefined();
      expect(newRefreshCookie).not.toBe(refreshCookieHeader);
    });

    it('debe rechazar con 401 si se intenta renovar sin cookie de refresh', async () => {
      const response = await request(app.getHttpServer()).post('/v1/auth/refresh').expect(401);

      expect(response.body.errorCode).toBe('INVALID_REFRESH_TOKEN');
    });

    it('debe cerrar sesión con logout y revocar el token en la siguiente petición', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Cookie', [refreshCookieHeader])
        .expect(204);

      // El token revocado ya no debe permitir refresh
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .set('Cookie', [refreshCookieHeader])
        .expect(401);

      expect(response.body.errorCode).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('GET /v1/auth/me', () => {
    let adminToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer()).post('/v1/auth/login').send({
        email: 'admin@clinica.com',
        password: rawPassword,
      });
      adminToken = loginRes.body.accessToken;
    });

    it('debe rechazar con 401 si no se envía Bearer token', async () => {
      await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
    });

    it('debe devolver el perfil del usuario autenticado con Bearer token válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: adminId,
        clinicId: testClinicId,
        email: 'admin@clinica.com',
        fullName: 'Dra. Administradora',
        role: 'ADMIN',
        isActive: true,
        clinic: {
          id: testClinicId,
          name: 'Clínica Odontológica Especializada',
        },
      });
    });
  });

  describe('Control de acceso por rol: ADMIN vs AUXILIARY (RC-005)', () => {
    let adminToken: string;
    let auxiliaryToken: string;

    beforeAll(async () => {
      const adminLogin = await request(app.getHttpServer()).post('/v1/auth/login').send({
        email: 'admin@clinica.com',
        password: rawPassword,
      });
      adminToken = adminLogin.body.accessToken;

      const auxLogin = await request(app.getHttpServer()).post('/v1/auth/login').send({
        email: 'auxiliar@clinica.com',
        password: rawPassword,
      });
      auxiliaryToken = auxLogin.body.accessToken;
    });

    it('debe permitir acceso a GET /v1/auth/admin-only para rol ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Acceso concedido a administradora');
    });

    it('debe rechazar con 403 (FORBIDDEN_ROLE) a GET /v1/auth/admin-only para rol AUXILIARY', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/admin-only')
        .set('Authorization', `Bearer ${auxiliaryToken}`)
        .expect(403);

      expect(response.body.errorCode).toBe('FORBIDDEN_ROLE');
    });
  });
});
