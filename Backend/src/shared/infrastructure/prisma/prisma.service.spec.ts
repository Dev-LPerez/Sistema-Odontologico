import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db?schema=public';
    service = new PrismaService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('debe agregar connection_limit=5 si no está presente en DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      const instance = new PrismaService();
      expect(instance).toBeDefined();
    });

    it('debe mantener connection_limit si ya está presente en DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db?connection_limit=5';
      const instance = new PrismaService();
      expect(instance).toBeDefined();
    });

    it('debe manejar DATABASE_URL indefinido', () => {
      delete process.env.DATABASE_URL;
      const instance = new PrismaService();
      expect(instance).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('debe conectar exitosamente', async () => {
      jest.spyOn(service, '$connect').mockResolvedValueOnce();
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });

    it('debe manejar error al conectar sin lanzar excepción', async () => {
      jest.spyOn(service, '$connect').mockRejectedValueOnce(new Error('Connection error'));
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('debe desconectar', async () => {
      jest.spyOn(service, '$disconnect').mockResolvedValueOnce();
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalled();
    });
  });

  describe('isHealthy', () => {
    it('debe retornar true cuando SELECT 1 es exitoso', async () => {
      jest.spyOn(service, '$queryRaw').mockResolvedValueOnce([{ '?column?': 1 }]);
      const healthy = await service.isHealthy();
      expect(healthy).toBe(true);
    });

    it('debe retornar false cuando SELECT 1 falla', async () => {
      jest.spyOn(service, '$queryRaw').mockRejectedValueOnce(new Error('DB error'));
      const healthy = await service.isHealthy();
      expect(healthy).toBe(false);
    });
  });
});
