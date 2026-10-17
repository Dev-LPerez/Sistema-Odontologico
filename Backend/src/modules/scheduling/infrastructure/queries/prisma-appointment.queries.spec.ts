import { PrismaAppointmentQueries } from './prisma-appointment.queries';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import { AppointmentStatusDb } from '@prisma/client';

describe('PrismaAppointmentQueries', () => {
  let queries: PrismaAppointmentQueries;
  let mockPrisma: {
    client: {
      appointment: {
        findFirst: jest.Mock;
        findMany: jest.Mock;
      };
    };
  };

  const fixedNow = new Date('2026-10-20T10:00:00.000Z');
  const sampleRecord = {
    id: 'appt-1',
    clinicId: 'clinic-123',
    patientId: 'patient-1',
    procedureId: 'proc-1',
    startTime: new Date('2026-10-20T14:00:00.000Z'),
    endTime: new Date('2026-10-20T15:00:00.000Z'),
    durationMinutes: 60,
    status: AppointmentStatusDb.SCHEDULED,
    cancellationReason: null,
    notes: 'Nota',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };

  beforeEach(() => {
    mockPrisma = {
      client: {
        appointment: {
          findFirst: jest.fn().mockResolvedValue(sampleRecord),
          findMany: jest.fn().mockResolvedValue([sampleRecord]),
        },
      },
    };
    queries = new PrismaAppointmentQueries(mockPrisma as unknown as PrismaService);
  });

  it('should get appointment by id', async () => {
    const res = await queries.getById('clinic-123', 'appt-1');
    expect(res).not.toBeNull();
    expect(res?.id).toBe('appt-1');

    mockPrisma.client.appointment.findFirst.mockResolvedValueOnce(null);
    const nonExistent = await queries.getById('clinic-123', 'non-existent');
    expect(nonExistent).toBeNull();
  });

  it('should list appointments with various filter options', async () => {
    // With all filters
    const resAll = await queries.list({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      status: AppointmentStatus.SCHEDULED,
      startDate: new Date('2026-10-20T00:00:00.000Z'),
      endDate: new Date('2026-10-20T23:59:59.000Z'),
    });
    expect(resAll).toHaveLength(1);
    expect(resAll[0].id).toBe('appt-1');

    // With minimal filter (only clinicId)
    const resMin = await queries.list({ clinicId: 'clinic-123' });
    expect(resMin).toHaveLength(1);

    // With only startDate
    const resStart = await queries.list({
      clinicId: 'clinic-123',
      startDate: new Date('2026-10-20T00:00:00.000Z'),
    });
    expect(resStart).toHaveLength(1);

    // With only endDate
    const resEnd = await queries.list({
      clinicId: 'clinic-123',
      endDate: new Date('2026-10-20T23:59:59.000Z'),
    });
    expect(resEnd).toHaveLength(1);
  });
});
