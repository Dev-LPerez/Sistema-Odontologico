import {
  AppointmentQueriesPort,
  AppointmentDto,
  ListAppointmentsFilter,
} from '../../application/ports/appointment-queries.port';
import { InMemoryAppointmentRepository } from '../repositories/in-memory-appointment.repository';
import { AppointmentMapper } from '../mappers/appointment.mapper';

export class InMemoryAppointmentQueries implements AppointmentQueriesPort {
  constructor(private readonly repository: InMemoryAppointmentRepository) {}

  async getById(clinicId: string, id: string): Promise<AppointmentDto | null> {
    const apt = await this.repository.findById(clinicId, id);
    if (!apt) {
      return null;
    }
    const prismaModel = AppointmentMapper.toPrisma(apt);
    return AppointmentMapper.toDto(prismaModel);
  }

  async list(filter: ListAppointmentsFilter): Promise<AppointmentDto[]> {
    const items = (this.repository as unknown as { items: Map<string, unknown> }).items;
    const result: AppointmentDto[] = [];
    for (const apt of items.values()) {
      const dto = AppointmentMapper.toDto(
        AppointmentMapper.toPrisma(apt as Parameters<typeof AppointmentMapper.toPrisma>[0]),
      );
      if (this.matchesFilter(dto, filter)) {
        result.push(dto);
      }
    }
    return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private matchesFilter(dto: AppointmentDto, filter: ListAppointmentsFilter): boolean {
    if (dto.clinicId !== filter.clinicId) {
      return false;
    }
    if (filter.status && dto.status !== filter.status) {
      return false;
    }
    if (filter.patientId && dto.patientId !== filter.patientId) {
      return false;
    }
    if (filter.startDate && dto.startTime < filter.startDate) {
      return false;
    }
    if (filter.endDate && dto.startTime > filter.endDate) {
      return false;
    }
    return true;
  }
}
