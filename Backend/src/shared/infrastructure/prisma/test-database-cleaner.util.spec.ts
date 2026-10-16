import {
  assertSafeTestDatabase,
  cleanDatabaseForContractTests,
} from './test-database-cleaner.util';
import { PrismaService } from './prisma.service';

describe('test-database-cleaner.util', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('assertSafeTestDatabase', () => {
    it('debe lanzar error cuando nodeEnv es production', () => {
      expect(() =>
        assertSafeTestDatabase('postgresql://user:pass@localhost:5432/my_test', 'production'),
      ).toThrow('Refusing to clean database in production environment');
    });

    it('debe lanzar error cuando DATABASE_URL no está definida', () => {
      delete process.env.DATABASE_URL;
      expect(() => assertSafeTestDatabase(undefined, 'test')).toThrow(
        'DATABASE_URL is not defined; cannot verify safety of database cleanup',
      );
    });

    it('debe permitir la limpieza cuando el host es localhost', () => {
      expect(() =>
        assertSafeTestDatabase(
          'postgresql://postgres:postgres@localhost:5432/odontologia_dev',
          'test',
        ),
      ).not.toThrow();
    });

    it('debe permitir la limpieza cuando el host es 127.0.0.1', () => {
      expect(() =>
        assertSafeTestDatabase(
          'postgresql://postgres:postgres@127.0.0.1:5432/odontologia_dev',
          'test',
        ),
      ).not.toThrow();
    });

    it('debe permitir la limpieza cuando el host es postgres (servicio Docker/CI)', () => {
      expect(() =>
        assertSafeTestDatabase(
          'postgresql://postgres:postgres@postgres:5432/odontologia_dev',
          'test',
        ),
      ).not.toThrow();
    });

    it('debe permitir la limpieza en host remoto si el nombre de la base de datos termina en _test', () => {
      expect(() =>
        assertSafeTestDatabase(
          'postgresql://admin:secret@aws-rds.internal:5432/consultorio_test',
          'test',
        ),
      ).not.toThrow();
    });

    it('debe permitir la limpieza en host remoto si el nombre de la base de datos termina en -test', () => {
      expect(() =>
        assertSafeTestDatabase(
          'postgresql://admin:secret@aws-rds.internal:5432/consultorio-test',
          'test',
        ),
      ).not.toThrow();
    });

    it('debe permitir la limpieza en host remoto si ALLOW_CONTRACT_DB_CLEANUP es true', () => {
      process.env.ALLOW_CONTRACT_DB_CLEANUP = 'true';
      expect(() =>
        assertSafeTestDatabase(
          'postgresql://admin:secret@aws-rds.internal:5432/consultorio_remoto',
          'test',
        ),
      ).not.toThrow();
    });

    it('debe rechazar la limpieza en host remoto si el nombre no termina en _test ni se define la variable de override', () => {
      delete process.env.ALLOW_CONTRACT_DB_CLEANUP;
      expect(() =>
        assertSafeTestDatabase(
          'postgresql://admin:secret@aws-rds.internal:5432/consultorio_produccion',
          'test',
        ),
      ).toThrow('Refusing to clean database on remote/non-test host: aws-rds.internal');
    });

    it('debe lanzar error cuando el formato de la URL es inválido', () => {
      expect(() => assertSafeTestDatabase('url_totalmente_invalida', 'test')).toThrow(
        'Invalid DATABASE_URL for safety check',
      );
    });
  });

  describe('cleanDatabaseForContractTests', () => {
    it('debe invocar deleteMany en todas las tablas en orden respetando claves foráneas', async () => {
      const deletedTables: string[] = [];
      const createDeleteMock = (table: string) => ({
        deleteMany: jest.fn().mockImplementation(() => {
          deletedTables.push(table);
          return Promise.resolve({ count: 0 });
        }),
      });

      const mockPrisma = {
        clinicalHistoryVersion: createDeleteMock('clinicalHistoryVersion'),
        clinicalAttentionVersion: createDeleteMock('clinicalAttentionVersion'),
        attentionMaterialUsed: createDeleteMock('attentionMaterialUsed'),
        clinicalAttention: createDeleteMock('clinicalAttention'),
        treatmentPlanItem: createDeleteMock('treatmentPlanItem'),
        clinicalHistory: createDeleteMock('clinicalHistory'),
        patientProcedurePrice: createDeleteMock('patientProcedurePrice'),
        procedure: createDeleteMock('procedure'),
        material: createDeleteMock('material'),
        odontogramSnapshot: createDeleteMock('odontogramSnapshot'),
        odontogram: createDeleteMock('odontogram'),
        patient: createDeleteMock('patient'),
        refreshSession: createDeleteMock('refreshSession'),
        user: createDeleteMock('user'),
        clinic: createDeleteMock('clinic'),
      } as unknown as PrismaService;

      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/odontologia_test';
      process.env.NODE_ENV = 'test';

      await cleanDatabaseForContractTests(mockPrisma);

      expect(deletedTables).toEqual([
        'clinicalHistoryVersion',
        'clinicalAttentionVersion',
        'attentionMaterialUsed',
        'clinicalAttention',
        'treatmentPlanItem',
        'clinicalHistory',
        'patientProcedurePrice',
        'procedure',
        'material',
        'odontogramSnapshot',
        'odontogram',
        'patient',
        'refreshSession',
        'user',
        'clinic',
      ]);
    });
  });
});
