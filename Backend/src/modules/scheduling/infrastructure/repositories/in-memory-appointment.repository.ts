import { AppointmentRepositoryPort } from '../../domain/appointment.repository.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { AppointmentStatus } from '../../domain/appointment-status.enum';

export class InMemoryAppointmentRepository implements AppointmentRepositoryPort {
  private readonly items = new Map<string, Appointment>();

  async save(appointment: Appointment): Promise<void> {
    this.items.set(appointment.id, appointment);
  }

  async findById(clinicId: string, id: string): Promise<Appointment | null> {
    const item = this.items.get(id);
    if (!item || item.clinicId !== clinicId) {
      return null;
    }
    return item;
  }

  async findConflicting(
    clinicId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<Appointment | null> {
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();

    for (const apt of this.items.values()) {
      if (apt.clinicId !== clinicId || apt.status === AppointmentStatus.CANCELLED) {
        continue;
      }
      if (excludeAppointmentId && apt.id === excludeAppointmentId) {
        continue;
      }
      if (startMs < apt.timeSlot.endTime.getTime() && endMs > apt.timeSlot.startTime.getTime()) {
        return apt;
      }
    }
    return null;
  }

  async countDailyActiveAppointments(
    clinicId: string,
    dayStartUtc: Date,
    dayEndUtc: Date,
    excludeAppointmentId?: string,
  ): Promise<number> {
    const startMs = dayStartUtc.getTime();
    const endMs = dayEndUtc.getTime();
    let count = 0;

    for (const apt of this.items.values()) {
      if (apt.clinicId !== clinicId || apt.status === AppointmentStatus.CANCELLED) {
        continue;
      }
      if (excludeAppointmentId && apt.id === excludeAppointmentId) {
        continue;
      }
      const aptStartMs = apt.timeSlot.startTime.getTime();
      if (aptStartMs >= startMs && aptStartMs <= endMs) {
        count++;
      }
    }
    return count;
  }
}
