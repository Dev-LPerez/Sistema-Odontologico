import { Module } from '@nestjs/common';
import { SharedModule, PrismaModule } from '../../shared';
import { IdentityModule } from '../identity';
import { AVAILABILITY_REPOSITORY } from './domain/availability.repository.port';
import { SCHEDULE_BLOCK_REPOSITORY } from './domain/schedule-block.repository.port';
import { APPOINTMENT_REPOSITORY } from './domain/appointment.repository.port';
import { APPOINTMENT_QUERIES } from './application/ports/appointment-queries.port';
import { PrismaAvailabilityRepository } from './infrastructure/repositories/prisma-availability.repository';
import { PrismaScheduleBlockRepository } from './infrastructure/repositories/prisma-schedule-block.repository';
import { PrismaAppointmentRepository } from './infrastructure/repositories/prisma-appointment.repository';
import { PrismaAppointmentQueries } from './infrastructure/queries/prisma-appointment.queries';
import { ConfigureAvailabilityUseCase } from './application/use-cases/configure-availability.use-case';
import { GetAvailabilityQuery } from './application/queries/get-availability.query';
import { CreateScheduleBlockUseCase } from './application/use-cases/create-schedule-block.use-case';
import { ListScheduleBlocksQuery } from './application/queries/list-schedule-blocks.query';
import { ScheduleAppointmentUseCase } from './application/use-cases/schedule-appointment.use-case';
import { RescheduleAppointmentUseCase } from './application/use-cases/reschedule-appointment.use-case';
import { CancelAppointmentUseCase } from './application/use-cases/cancel-appointment.use-case';
import { ChangeAppointmentStatusUseCase } from './application/use-cases/change-appointment-status.use-case';
import { GetAppointmentByIdQuery } from './application/queries/get-appointment-by-id.query';
import { ListAppointmentsQuery } from './application/queries/list-appointments.query';
import { SchedulingController } from './presentation/scheduling.controller';

@Module({
  imports: [SharedModule, PrismaModule, IdentityModule],
  controllers: [SchedulingController],
  providers: [
    {
      provide: AVAILABILITY_REPOSITORY,
      useClass: PrismaAvailabilityRepository,
    },
    {
      provide: SCHEDULE_BLOCK_REPOSITORY,
      useClass: PrismaScheduleBlockRepository,
    },
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
    {
      provide: APPOINTMENT_QUERIES,
      useClass: PrismaAppointmentQueries,
    },
    ConfigureAvailabilityUseCase,
    GetAvailabilityQuery,
    CreateScheduleBlockUseCase,
    ListScheduleBlocksQuery,
    ScheduleAppointmentUseCase,
    RescheduleAppointmentUseCase,
    CancelAppointmentUseCase,
    ChangeAppointmentStatusUseCase,
    GetAppointmentByIdQuery,
    ListAppointmentsQuery,
  ],
  exports: [
    AVAILABILITY_REPOSITORY,
    SCHEDULE_BLOCK_REPOSITORY,
    APPOINTMENT_REPOSITORY,
    APPOINTMENT_QUERIES,
    ConfigureAvailabilityUseCase,
    GetAvailabilityQuery,
    CreateScheduleBlockUseCase,
    ListScheduleBlocksQuery,
    ScheduleAppointmentUseCase,
    RescheduleAppointmentUseCase,
    CancelAppointmentUseCase,
    ChangeAppointmentStatusUseCase,
    GetAppointmentByIdQuery,
    ListAppointmentsQuery,
  ],
})
export class SchedulingModule {}
