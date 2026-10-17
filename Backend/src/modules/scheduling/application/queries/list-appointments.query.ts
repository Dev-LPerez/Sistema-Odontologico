import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENT_QUERIES,
  AppointmentDto,
  AppointmentQueriesPort,
  ListAppointmentsFilter,
} from '../ports/appointment-queries.port';

@Injectable()
export class ListAppointmentsQuery {
  constructor(
    @Inject(APPOINTMENT_QUERIES)
    private readonly queries: AppointmentQueriesPort,
  ) {}

  async execute(filter: ListAppointmentsFilter): Promise<AppointmentDto[]> {
    return this.queries.list(filter);
  }
}
