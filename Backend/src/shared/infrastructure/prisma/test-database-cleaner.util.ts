import { PrismaService } from './prisma.service';

function isAllowedHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'postgres';
}

function isTestDatabaseName(pathname: string): boolean {
  return pathname.endsWith('_test') || pathname.endsWith('-test');
}

function parseDatabaseUrl(url: string): URL {
  try {
    return new URL(url);
  } catch (err: unknown) {
    throw new Error(`Invalid DATABASE_URL for safety check: ${(err as Error).message}`);
  }
}

/**
 * Valida que la base de datos de pruebas sea segura para ejecutar limpieza (deleteMany).
 * Lanza un Error explícito si se detecta un entorno o host no autorizado.
 *
 * @param databaseUrl URL de conexión a la base de datos (por defecto process.env.DATABASE_URL)
 * @param nodeEnv Variable de entorno NODE_ENV (por defecto process.env.NODE_ENV)
 */
export function assertSafeTestDatabase(databaseUrl?: string, nodeEnv?: string): void {
  const currentEnv = nodeEnv ?? process.env.NODE_ENV;
  if (currentEnv === 'production') {
    throw new Error('Refusing to clean database in production environment');
  }

  if (process.env.ALLOW_CONTRACT_DB_CLEANUP === 'true') {
    return;
  }

  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined; cannot verify safety of database cleanup');
  }

  const parsed = parseDatabaseUrl(url);
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (!isAllowedHost(hostname) && !isTestDatabaseName(pathname)) {
    throw new Error(
      `Refusing to clean database on remote/non-test host: ${hostname}. Database name must end in '_test' or host must be localhost/127.0.0.1/postgres, or set ALLOW_CONTRACT_DB_CLEANUP=true`,
    );
  }
}

/**
 * Ejecuta el borrado de tablas de forma centralizada en el orden jerárquico
 * estricto de claves foráneas para respetar onDelete: Restrict.
 *
 * @param prisma Instancia activa de PrismaService
 */
export async function cleanDatabaseForContractTests(prisma: PrismaService): Promise<void> {
  assertSafeTestDatabase(process.env.DATABASE_URL, process.env.NODE_ENV);

  // Orden jerárquico estricto: dependientes e hijas primero
  await prisma.appointment.deleteMany();
  await prisma.scheduleBlock.deleteMany();
  await prisma.availabilityConfig.deleteMany();
  await prisma.clinicalHistoryVersion.deleteMany();
  await prisma.clinicalAttentionVersion.deleteMany();
  await prisma.attentionMaterialUsed.deleteMany();
  await prisma.clinicalAttention.deleteMany();
  await prisma.treatmentPlanItem.deleteMany();
  await prisma.clinicalHistory.deleteMany();
  await prisma.patientProcedurePrice.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.material.deleteMany();
  await prisma.odontogramSnapshot.deleteMany();
  await prisma.odontogram.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
}
