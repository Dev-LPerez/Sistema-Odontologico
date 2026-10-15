import { CatalogsController } from './catalogs.controller';
import { CreateProcedureUseCase } from '../application/use-cases/create-procedure.use-case';
import { UpdateProcedureUseCase } from '../application/use-cases/update-procedure.use-case';
import { ListProceduresQuery } from '../application/queries/list-procedures.query';
import { SetPatientProcedurePriceUseCase } from '../application/use-cases/set-patient-procedure-price.use-case';
import { ListPatientProcedurePricesQuery } from '../application/queries/list-patient-procedure-prices.query';
import { CreateMaterialUseCase } from '../application/use-cases/create-material.use-case';
import { UpdateMaterialUseCase } from '../application/use-cases/update-material.use-case';
import { ConsumeMaterialStockUseCase } from '../application/use-cases/consume-material-stock.use-case';
import { ListMaterialsQuery } from '../application/queries/list-materials.query';
import { Procedure } from '../domain/procedure.entity';
import { PatientProcedurePrice } from '../domain/patient-procedure-price.entity';
import { Material } from '../domain/material.entity';
import { Money } from '../domain/money.vo';
import { AuthenticatedUserPayload } from '../../../shared/presentation/decorators';
import { UserRole } from '../../identity';

describe('CatalogsController', () => {
  let controller: CatalogsController;
  let createProcedureUseCase: jest.Mocked<CreateProcedureUseCase>;
  let updateProcedureUseCase: jest.Mocked<UpdateProcedureUseCase>;
  let listProceduresQuery: jest.Mocked<ListProceduresQuery>;
  let setPatientProcedurePriceUseCase: jest.Mocked<SetPatientProcedurePriceUseCase>;
  let listPatientProcedurePricesQuery: jest.Mocked<ListPatientProcedurePricesQuery>;
  let createMaterialUseCase: jest.Mocked<CreateMaterialUseCase>;
  let updateMaterialUseCase: jest.Mocked<UpdateMaterialUseCase>;
  let consumeMaterialStockUseCase: jest.Mocked<ConsumeMaterialStockUseCase>;
  let listMaterialsQuery: jest.Mocked<ListMaterialsQuery>;

  const fixedNow = new Date('2026-10-15T10:00:00.000Z');
  const mockUser: AuthenticatedUserPayload = {
    sub: 'user-admin-1',
    clinicId: 'clinic-123',
    email: 'admin@clinica.com',
    role: UserRole.ADMIN,
  };

  const sampleProcedure = Procedure.create({
    id: 'proc-1',
    clinicId: 'clinic-123',
    code: 'RES-EST',
    name: 'Resina estética',
    description: 'Descripción',
    basePrice: Money.from(180000),
    isActive: true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const samplePrice = PatientProcedurePrice.create({
    id: 'price-1',
    clinicId: 'clinic-123',
    patientId: 'patient-1',
    procedureId: 'proc-1',
    customPrice: Money.from(140000),
    reason: 'Tarifa familiar',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const sampleMaterial = Material.create({
    id: 'mat-1',
    clinicId: 'clinic-123',
    brand: '3M',
    reference: 'Filtek Z350',
    type: 'RESIN',
    color: 'A2',
    currentStock: 10,
    minStock: 2,
    isActive: true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  beforeEach(() => {
    createProcedureUseCase = {
      execute: jest.fn().mockResolvedValue(sampleProcedure),
    } as unknown as jest.Mocked<CreateProcedureUseCase>;

    updateProcedureUseCase = {
      execute: jest.fn().mockResolvedValue(sampleProcedure),
    } as unknown as jest.Mocked<UpdateProcedureUseCase>;

    listProceduresQuery = {
      execute: jest.fn().mockResolvedValue([sampleProcedure]),
    } as unknown as jest.Mocked<ListProceduresQuery>;

    setPatientProcedurePriceUseCase = {
      execute: jest.fn().mockResolvedValue(samplePrice),
    } as unknown as jest.Mocked<SetPatientProcedurePriceUseCase>;

    listPatientProcedurePricesQuery = {
      execute: jest.fn().mockResolvedValue([samplePrice]),
    } as unknown as jest.Mocked<ListPatientProcedurePricesQuery>;

    createMaterialUseCase = {
      execute: jest.fn().mockResolvedValue(sampleMaterial),
    } as unknown as jest.Mocked<CreateMaterialUseCase>;

    updateMaterialUseCase = {
      execute: jest.fn().mockResolvedValue(sampleMaterial),
    } as unknown as jest.Mocked<UpdateMaterialUseCase>;

    consumeMaterialStockUseCase = {
      execute: jest.fn().mockResolvedValue(sampleMaterial),
    } as unknown as jest.Mocked<ConsumeMaterialStockUseCase>;

    listMaterialsQuery = {
      execute: jest.fn().mockResolvedValue([sampleMaterial]),
    } as unknown as jest.Mocked<ListMaterialsQuery>;

    controller = new CatalogsController(
      createProcedureUseCase,
      updateProcedureUseCase,
      listProceduresQuery,
      setPatientProcedurePriceUseCase,
      listPatientProcedurePricesQuery,
      createMaterialUseCase,
      updateMaterialUseCase,
      consumeMaterialStockUseCase,
      listMaterialsQuery,
    );
  });

  it('should create procedure', async () => {
    const result = await controller.createProcedure(mockUser, {
      code: 'RES-EST',
      name: 'Resina estética',
      description: 'Descripción',
      basePriceCop: 180000,
    });

    expect(createProcedureUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      code: 'RES-EST',
      name: 'Resina estética',
      description: 'Descripción',
      basePriceCop: 180000,
    });
    expect(result.id).toBe('proc-1');
    expect(result.basePriceCop).toBe(180000);
  });

  it('should update procedure', async () => {
    const result = await controller.updateProcedure(mockUser, 'proc-1', {
      name: 'Nuevo nombre',
      basePriceCop: 200000,
    });

    expect(updateProcedureUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      id: 'proc-1',
      name: 'Nuevo nombre',
      basePriceCop: 200000,
      description: undefined,
      isActive: undefined,
    });
    expect(result.id).toBe('proc-1');
  });

  it('should list procedures', async () => {
    const result = await controller.listProcedures(mockUser, { includeInactive: true });

    expect(listProceduresQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      includeInactive: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('RES-EST');
  });

  it('should set patient procedure price', async () => {
    const result = await controller.setPatientProcedurePrice(mockUser, {
      patientId: 'patient-1',
      procedureId: 'proc-1',
      customPriceCop: 140000,
      reason: 'Tarifa familiar',
    });

    expect(setPatientProcedurePriceUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      customPriceCop: 140000,
      reason: 'Tarifa familiar',
    });
    expect(result.customPriceCop).toBe(140000);
    expect(result.reason).toBe('Tarifa familiar');
  });

  it('should list patient procedure prices', async () => {
    const result = await controller.listPatientProcedurePrices(mockUser, {
      patientId: 'patient-1',
    });

    expect(listPatientProcedurePricesQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
    });
    expect(result).toHaveLength(1);
    expect(result[0].customPriceCop).toBe(140000);
  });

  it('should create material', async () => {
    const result = await controller.createMaterial(mockUser, {
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'RESIN',
      color: 'A2',
      currentStock: 10,
      minStock: 2,
    });

    expect(createMaterialUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'RESIN',
      color: 'A2',
      currentStock: 10,
      minStock: 2,
    });
    expect(result.id).toBe('mat-1');
    expect(result.currentStock).toBe(10);
  });

  it('should update material', async () => {
    const result = await controller.updateMaterial(mockUser, 'mat-1', {
      currentStock: 15,
    });

    expect(updateMaterialUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      id: 'mat-1',
      currentStock: 15,
      brand: undefined,
      reference: undefined,
      type: undefined,
      color: undefined,
      minStock: undefined,
      isActive: undefined,
    });
    expect(result.id).toBe('mat-1');
  });

  it('should list materials', async () => {
    const result = await controller.listMaterials(mockUser, { includeInactive: false });

    expect(listMaterialsQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      includeInactive: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe('3M');
  });

  it('should consume material stock', async () => {
    const result = await controller.consumeMaterialStock(mockUser, 'mat-1', { quantity: 2 });

    expect(consumeMaterialStockUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      materialId: 'mat-1',
      quantity: 2,
    });
    expect(result.id).toBe('mat-1');
  });
});
