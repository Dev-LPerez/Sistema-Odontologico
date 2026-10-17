import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/presentation/guards/roles.guard';
import { CurrentClinic, Roles } from '../../../shared/presentation/decorators';
import { UserRole } from '../../identity';
import { ConfigureAvailabilityUseCase } from '../application/use-cases/configure-availability.use-case';
import { GetAvailabilityQuery } from '../application/queries/get-availability.query';
import { CreateScheduleBlockUseCase } from '../application/use-cases/create-schedule-block.use-case';
import { ListScheduleBlocksQuery } from '../application/queries/list-schedule-blocks.query';
import { ScheduleAppointmentUseCase } from '../application/use-cases/schedule-appointment.use-case';
import { RescheduleAppointmentUseCase } from '../application/use-cases/reschedule-appointment.use-case';
import { CancelAppointmentUseCase } from '../application/use-cases/cancel-appointment.use-case';
import { ChangeAppointmentStatusUseCase } from '../application/use-cases/change-appointment-status.use-case';
import { GetAppointmentByIdQuery } from '../application/queries/get-appointment-by-id.query';
import { ListAppointmentsQuery } from '../application/queries/list-appointments.query';
import { ConfigureAvailabilityDto, AvailabilityResponseDto } from './dto/availability.dto';
import {
  CreateScheduleBlockDto,
  ListScheduleBlocksQueryDto,
  ScheduleBlockResponseDto,
} from './dto/schedule-block.dto';
import {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  ChangeAppointmentStatusDto,
  ListAppointmentsQueryDto,
  AppointmentResponseDto,
} from './dto/appointment.dto';
import { WeeklyAvailability } from '../domain/weekly-availability.entity';
import { ScheduleBlock } from '../domain/schedule-block.entity';
import { Appointment } from '../domain/appointment.aggregate';
import { AppointmentDto } from '../application/ports/appointment-queries.port';
import { AppointmentNotFoundError } from '../domain/scheduling.errors';

@ApiTags('Scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(
    private readonly configureAvailabilityUseCase: ConfigureAvailabilityUseCase,
    private readonly getAvailabilityQuery: GetAvailabilityQuery,
    private readonly createScheduleBlockUseCase: CreateScheduleBlockUseCase,
    private readonly listScheduleBlocksQuery: ListScheduleBlocksQuery,
    private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase,
    private readonly rescheduleAppointmentUseCase: RescheduleAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly changeAppointmentStatusUseCase: ChangeAppointmentStatusUseCase,
    private readonly getAppointmentByIdQuery: GetAppointmentByIdQuery,
    private readonly listAppointmentsQuery: ListAppointmentsQuery,
  ) {}

  @Put('availability')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar disponibilidad semanal de atención' })
  @ApiResponse({ status: HttpStatus.OK, type: AvailabilityResponseDto })
  async configureAvailability(
    @CurrentClinic() clinicId: string,
    @Body() dto: ConfigureAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const availability = await this.configureAvailabilityUseCase.execute({
      clinicId,
      slots: dto.slots,
      maxDailyAppointments: dto.maxDailyAppointments,
    });
    return this.toAvailabilityResponse(availability);
  }

  @Get('availability')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar disponibilidad semanal de atención' })
  @ApiResponse({ status: HttpStatus.OK, type: AvailabilityResponseDto })
  async getAvailability(
    @CurrentClinic() clinicId: string,
  ): Promise<AvailabilityResponseDto | null> {
    const availability = await this.getAvailabilityQuery.execute(clinicId);
    return availability ? this.toAvailabilityResponse(availability) : null;
  }

  @Post('blocks')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un bloqueo temporal de agenda' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ScheduleBlockResponseDto })
  async createScheduleBlock(
    @CurrentClinic() clinicId: string,
    @Body() dto: CreateScheduleBlockDto,
  ): Promise<ScheduleBlockResponseDto> {
    const block = await this.createScheduleBlockUseCase.execute({
      clinicId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      reason: dto.reason,
    });
    return this.toScheduleBlockResponse(block);
  }

  @Get('blocks')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar bloqueos temporales de agenda' })
  @ApiResponse({ status: HttpStatus.OK, type: [ScheduleBlockResponseDto] })
  async listScheduleBlocks(
    @CurrentClinic() clinicId: string,
    @Query() query: ListScheduleBlocksQueryDto,
  ): Promise<ScheduleBlockResponseDto[]> {
    const blocks = await this.listScheduleBlocksQuery.execute({
      clinicId,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
    });
    return blocks.map((b) => this.toScheduleBlockResponse(b));
  }

  @Post('appointments')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agendar una nueva cita odontológica' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AppointmentResponseDto })
  async scheduleAppointment(
    @CurrentClinic() clinicId: string,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.scheduleAppointmentUseCase.execute({
      clinicId,
      patientId: dto.patientId,
      procedureId: dto.procedureId,
      startTime: new Date(dto.startTime),
      durationMinutes: dto.durationMinutes,
      notes: dto.notes,
    });
    return this.toAppointmentResponse(appointment);
  }

  @Get('appointments')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar y filtrar citas odontológicas' })
  @ApiResponse({ status: HttpStatus.OK, type: [AppointmentResponseDto] })
  async listAppointments(
    @CurrentClinic() clinicId: string,
    @Query() query: ListAppointmentsQueryDto,
  ): Promise<AppointmentResponseDto[]> {
    const appointments = await this.listAppointmentsQuery.execute({
      clinicId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      patientId: query.patientId,
      status: query.status,
    });
    return appointments.map((a) => this.toAppointmentDtoResponse(a));
  }

  @Get('appointments/:id')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener detalle de una cita odontológica' })
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentResponseDto })
  async getAppointmentById(
    @CurrentClinic() clinicId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AppointmentResponseDto> {
    const appt = await this.getAppointmentByIdQuery.execute({
      clinicId,
      appointmentId: id,
    });
    if (!appt) {
      throw new AppointmentNotFoundError(id);
    }
    return this.toAppointmentDtoResponse(appt);
  }

  @Patch('appointments/:id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprogramar una cita odontológica' })
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentResponseDto })
  async rescheduleAppointment(
    @CurrentClinic() clinicId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.rescheduleAppointmentUseCase.execute({
      clinicId,
      appointmentId: id,
      newStartTime: new Date(dto.newStartTime),
      newDurationMinutes: dto.newDurationMinutes,
    });
    return this.toAppointmentResponse(appointment);
  }

  @Patch('appointments/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una cita odontológica' })
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentResponseDto })
  async cancelAppointment(
    @CurrentClinic() clinicId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.cancelAppointmentUseCase.execute({
      clinicId,
      appointmentId: id,
      cancellationReason: dto.cancellationReason,
    });
    return this.toAppointmentResponse(appointment);
  }

  @Patch('appointments/:id/status')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el estado de una cita odontológica' })
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentResponseDto })
  async changeAppointmentStatus(
    @CurrentClinic() clinicId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAppointmentStatusDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.changeAppointmentStatusUseCase.execute({
      clinicId,
      appointmentId: id,
      status: dto.status,
    });
    return this.toAppointmentResponse(appointment);
  }

  private toAvailabilityResponse(availability: WeeklyAvailability): AvailabilityResponseDto {
    return {
      clinicId: availability.clinicId,
      maxDailyAppointments: availability.maxDailyAppointments,
      slots: availability.slots,
      createdAt: availability.createdAt.toISOString(),
      updatedAt: availability.updatedAt.toISOString(),
    };
  }

  private toScheduleBlockResponse(block: ScheduleBlock): ScheduleBlockResponseDto {
    return {
      id: block.id,
      clinicId: block.clinicId,
      startDate: block.startDate.toISOString(),
      endDate: block.endDate.toISOString(),
      reason: block.reason,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    };
  }

  private toAppointmentResponse(appt: Appointment): AppointmentResponseDto {
    return {
      id: appt.id,
      clinicId: appt.clinicId,
      patientId: appt.patientId,
      procedureId: appt.procedureId,
      startTime: appt.timeSlot.startTime.toISOString(),
      endTime: appt.timeSlot.endTime.toISOString(),
      durationMinutes: appt.timeSlot.durationMinutes,
      status: appt.status,
      cancellationReason: appt.cancellationReason,
      notes: appt.notes,
      createdAt: appt.createdAt.toISOString(),
      updatedAt: appt.updatedAt.toISOString(),
    };
  }

  private toAppointmentDtoResponse(appt: AppointmentDto): AppointmentResponseDto {
    return {
      id: appt.id,
      clinicId: appt.clinicId,
      patientId: appt.patientId,
      procedureId: appt.procedureId,
      startTime: appt.startTime.toISOString(),
      endTime: appt.endTime.toISOString(),
      durationMinutes: appt.durationMinutes,
      status: appt.status,
      cancellationReason: appt.cancellationReason,
      notes: appt.notes,
      createdAt: appt.createdAt.toISOString(),
      updatedAt: appt.updatedAt.toISOString(),
    };
  }
}
