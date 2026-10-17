import { AppointmentStatusDb } from '@prisma/client';
import { AppointmentMapper } from './appointment.mapper';
import { AppointmentStatus } from '../../domain/appointment-status.enum';

describe('AppointmentMapper', () => {
  const fixedNow = new Date('2026-10-20T10:00:00.000Z');
  const startTime = new Date('2026-10-20T14:00:00.000Z');
  const endTime = new Date('2026-10-20T15:00:00.000Z');

  it('should map to domain and to prisma correctly', () => {
    const record = {
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      startTime,
      endTime,
      durationMinutes: 60,
      status: AppointmentStatusDb.SCHEDULED,
      cancellationReason: null,
      notes: 'Nota',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const domain = AppointmentMapper.toDomain(record);
    expect(domain.id).toBe('appt-1');
    expect(domain.status).toBe(AppointmentStatus.SCHEDULED);

    const prisma = AppointmentMapper.toPrisma(domain);
    expect(prisma.id).toBe('appt-1');
    expect(prisma.status).toBe(AppointmentStatusDb.SCHEDULED);

    const dto = AppointmentMapper.toDto(record);
    expect(dto.id).toBe('appt-1');
    expect(dto.status).toBe(AppointmentStatus.SCHEDULED);
  });

  it('should map all status enum values back and forth', () => {
    const statuses = [
      { domain: AppointmentStatus.SCHEDULED, db: AppointmentStatusDb.SCHEDULED },
      { domain: AppointmentStatus.CONFIRMED, db: AppointmentStatusDb.CONFIRMED },
      { domain: AppointmentStatus.ATTENDED, db: AppointmentStatusDb.ATTENDED },
      { domain: AppointmentStatus.NO_SHOW, db: AppointmentStatusDb.NO_SHOW },
      { domain: AppointmentStatus.CANCELLED, db: AppointmentStatusDb.CANCELLED },
    ];

    for (const { domain, db } of statuses) {
      expect(AppointmentMapper.statusToDomain(db)).toBe(domain);
      expect(AppointmentMapper.statusToPrisma(domain)).toBe(db);
    }

    expect(AppointmentMapper.statusToDomain('UNKNOWN' as unknown as AppointmentStatusDb)).toBe(
      AppointmentStatus.SCHEDULED,
    );
    expect(AppointmentMapper.statusToPrisma('UNKNOWN' as unknown as AppointmentStatus)).toBe(
      AppointmentStatusDb.SCHEDULED,
    );
  });
});
