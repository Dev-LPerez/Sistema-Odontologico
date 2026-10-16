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
import {
  CurrentUser,
  AuthenticatedUserPayload,
  Roles,
} from '../../../shared/presentation/decorators';
import { UserRole } from '../../identity';
import { CreateProcedureUseCase } from '../application/use-cases/create-procedure.use-case';
import { UpdateProcedureUseCase } from '../application/use-cases/update-procedure.use-case';
import { ListProceduresQuery } from '../application/queries/list-procedures.query';
import { SetPatientProcedurePriceUseCase } from '../application/use-cases/set-patient-procedure-price.use-case';
import { ListPatientProcedurePricesQuery } from '../application/queries/list-patient-procedure-prices.query';
import { CreateMaterialUseCase } from '../application/use-cases/create-material.use-case';
import { UpdateMaterialUseCase } from '../application/use-cases/update-material.use-case';
import { ConsumeMaterialStockUseCase } from '../application/use-cases/consume-material-stock.use-case';
import { ListMaterialsQuery } from '../application/queries/list-materials.query';
import {
  CreateProcedureDto,
  UpdateProcedureDto,
  ListProceduresQueryDto,
  ProcedureResponseDto,
} from './dto/procedure.dto';
import {
  SetPatientProcedurePriceDto,
  ListPatientProcedurePricesQueryDto,
  PatientProcedurePriceResponseDto,
} from './dto/patient-procedure-price.dto';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  ConsumeMaterialStockDto,
  ListMaterialsQueryDto,
  MaterialResponseDto,
} from './dto/material.dto';

@ApiTags('Catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalogs')
export class CatalogsController {
  constructor(
    private readonly createProcedureUseCase: CreateProcedureUseCase,
    private readonly updateProcedureUseCase: UpdateProcedureUseCase,
    private readonly listProceduresQuery: ListProceduresQuery,
    private readonly setPatientProcedurePriceUseCase: SetPatientProcedurePriceUseCase,
    private readonly listPatientProcedurePricesQuery: ListPatientProcedurePricesQuery,
    private readonly createMaterialUseCase: CreateMaterialUseCase,
    private readonly updateMaterialUseCase: UpdateMaterialUseCase,
    private readonly consumeMaterialStockUseCase: ConsumeMaterialStockUseCase,
    private readonly listMaterialsQuery: ListMaterialsQuery,
  ) {}

  @Post('procedures')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo procedimiento en el catálogo' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Procedimiento creado exitosamente',
    type: ProcedureResponseDto,
  })
  async createProcedure(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateProcedureDto,
  ): Promise<ProcedureResponseDto> {
    const procedure = await this.createProcedureUseCase.execute({
      clinicId: user.clinicId,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      basePriceCop: dto.basePriceCop,
    });

    return ProcedureResponseDto.fromDomain(procedure);
  }

  @Patch('procedures/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un procedimiento existente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Procedimiento actualizado exitosamente',
    type: ProcedureResponseDto,
  })
  async updateProcedure(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProcedureDto,
  ): Promise<ProcedureResponseDto> {
    const procedure = await this.updateProcedureUseCase.execute({
      clinicId: user.clinicId,
      id,
      name: dto.name,
      description: dto.description,
      basePriceCop: dto.basePriceCop,
      isActive: dto.isActive,
    });

    return ProcedureResponseDto.fromDomain(procedure);
  }

  @Get('procedures')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @ApiOperation({ summary: 'Listar procedimientos del consultorio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de procedimientos',
    type: [ProcedureResponseDto],
  })
  async listProcedures(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: ListProceduresQueryDto,
  ): Promise<ProcedureResponseDto[]> {
    const procedures = await this.listProceduresQuery.execute({
      clinicId: user.clinicId,
      includeInactive: query.includeInactive,
    });

    return procedures.map(ProcedureResponseDto.fromDomain);
  }

  @Put('patient-prices')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar precio especial de procedimiento por paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Precio personalizado registrado o actualizado',
    type: PatientProcedurePriceResponseDto,
  })
  async setPatientProcedurePrice(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: SetPatientProcedurePriceDto,
  ): Promise<PatientProcedurePriceResponseDto> {
    const price = await this.setPatientProcedurePriceUseCase.execute({
      clinicId: user.clinicId,
      patientId: dto.patientId,
      procedureId: dto.procedureId,
      customPriceCop: dto.customPriceCop,
      reason: dto.reason,
    });

    return PatientProcedurePriceResponseDto.fromDomain(price);
  }

  @Get('patient-prices')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @ApiOperation({ summary: 'Consultar precios personalizados de un paciente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de precios personalizados del paciente',
    type: [PatientProcedurePriceResponseDto],
  })
  async listPatientProcedurePrices(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: ListPatientProcedurePricesQueryDto,
  ): Promise<PatientProcedurePriceResponseDto[]> {
    const prices = await this.listPatientProcedurePricesQuery.execute({
      clinicId: user.clinicId,
      patientId: query.patientId,
    });

    return prices.map(PatientProcedurePriceResponseDto.fromDomain);
  }

  @Post('materials')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un material propio en el catálogo' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Material registrado exitosamente',
    type: MaterialResponseDto,
  })
  async createMaterial(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateMaterialDto,
  ): Promise<MaterialResponseDto> {
    const material = await this.createMaterialUseCase.execute({
      clinicId: user.clinicId,
      brand: dto.brand,
      reference: dto.reference,
      type: dto.type,
      color: dto.color,
      currentStock: dto.currentStock,
      minStock: dto.minStock,
    });

    return MaterialResponseDto.fromDomain(material);
  }

  @Patch('materials/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar datos de un material propio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Material actualizado exitosamente',
    type: MaterialResponseDto,
  })
  async updateMaterial(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialDto,
  ): Promise<MaterialResponseDto> {
    const material = await this.updateMaterialUseCase.execute({
      clinicId: user.clinicId,
      id,
      brand: dto.brand,
      reference: dto.reference,
      type: dto.type,
      color: dto.color,
      currentStock: dto.currentStock,
      minStock: dto.minStock,
      isActive: dto.isActive,
    });

    return MaterialResponseDto.fromDomain(material);
  }

  @Get('materials')
  @Roles(UserRole.ADMIN, UserRole.AUXILIARY)
  @ApiOperation({ summary: 'Listar materiales propios del consultorio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de materiales propios con estado de stock',
    type: [MaterialResponseDto],
  })
  async listMaterials(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: ListMaterialsQueryDto,
  ): Promise<MaterialResponseDto[]> {
    const materials = await this.listMaterialsQuery.execute({
      clinicId: user.clinicId,
      includeInactive: query.includeInactive,
    });

    return materials.map(MaterialResponseDto.fromDomain);
  }

  @Post('materials/:id/consume')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Descontar existencias de un material propio' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Existencias descontadas exitosamente',
    type: MaterialResponseDto,
  })
  async consumeMaterialStock(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConsumeMaterialStockDto,
  ): Promise<MaterialResponseDto> {
    const material = await this.consumeMaterialStockUseCase.execute({
      clinicId: user.clinicId,
      materialId: id,
      quantity: dto.quantity,
    });

    return MaterialResponseDto.fromDomain(material);
  }
}
