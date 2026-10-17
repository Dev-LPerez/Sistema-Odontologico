import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENT_QUERIES,
  AppointmentDto,
  AppointmentQueriesPort,
} from '../ports/appointment-queries.port';

export interface GetAppointmentByIdParams {
  clinicId: string;
  appointmentId: string;
}

@Injectable()
export class GetAppointmentByIdQuery {
  constructor(
    @Inject(APPOINTMENT_QUERIES)
    private readonly queries: AppointmentQueriesPort,
  ) {}

  async execute(params: GetAppointmentByIdParams): Promise<AppointmentDto | null> {
    return this.queries.getById(params.clinicId, params.appointmentId);
  }
}
