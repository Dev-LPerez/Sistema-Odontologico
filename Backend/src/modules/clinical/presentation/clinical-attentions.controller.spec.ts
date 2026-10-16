import { ClinicalAttentionsController } from './clinical-attentions.controller';
import { CreateClinicalAttentionUseCase } from '../application/use-cases/create-clinical-attention.use-case';
import { UpdateClinicalAttentionUseCase } from '../application/use-cases/update-clinical-attention.use-case';
import { AddAttentionMaterialUsedUseCase } from '../application/use-cases/add-attention-material-used.use-case';
import { CloseClinicalAttentionUseCase } from '../application/use-cases/close-clinical-attention.use-case';
import { AmendClosedClinicalAttentionUseCase } from '../application/use-cases/amend-closed-clinical-attention.use-case';
import { ListClinicalAttentionsByPatientQuery } from '../application/queries/list-clinical-attentions-by-patient.query';
import { GetClinicalAttentionByIdQuery } from '../application/queries/get-clinical-attention-by-id.query';
import { ListClinicalAttentionVersionsQuery } from '../application/queries/list-clinical-attention-versions.query';
import { GetToothMaterialHistoryQuery } from '../application/queries/get-tooth-material-history.query';
import { ClinicalAttention } from '../domain/clinical-attention.entity';
import { ClinicalAttentionVersion } from '../domain/clinical-attention-version.entity';
import { AttentionMaterialUsed } from '../domain/attention-material-used.entity';
import { ClinicalAttentionStatus } from '../domain/clinical-attention-status.enum';
import { UserRole } from '../../identity';
import { AuthenticatedUserPayload } from '../../../shared/presentation/decorators';
import { CreateClinicalAttentionDto } from './dto/create-clinical-attention.dto';
import { UpdateClinicalAttentionDto } from './dto/update-clinical-attention.dto';
import { AddAttentionMaterialUsedDto } from './dto/add-attention-material-used.dto';
import { AmendClinicalAttentionDto } from './dto/amend-clinical-attention.dto';

describe('ClinicalAttentionsController Unit Tests', () => {
  let controller: ClinicalAttentionsController;
  let createUseCase: jest.Mocked<CreateClinicalAttentionUseCase>;
  let updateUseCase: jest.Mocked<UpdateClinicalAttentionUseCase>;
  let addMaterialUseCase: jest.Mocked<AddAttentionMaterialUsedUseCase>;
  let closeUseCase: jest.Mocked<CloseClinicalAttentionUseCase>;
  let amendUseCase: jest.Mocked<AmendClosedClinicalAttentionUseCase>;
  let listQuery: jest.Mocked<ListClinicalAttentionsByPatientQuery>;
  let getByIdQuery: jest.Mocked<GetClinicalAttentionByIdQuery>;
  let listVersionsQuery: jest.Mocked<ListClinicalAttentionVersionsQuery>;
  let getToothMaterialHistoryQuery: jest.Mocked<GetToothMaterialHistoryQuery>;

  const mockAdminUser: AuthenticatedUserPayload = {
    sub: 'user-admin-1',
    clinicId: 'clinic-123',
    email: 'dra.angelee@example.com',
    role: UserRole.ADMIN,
  };

  const mockAuxiliaryUser: AuthenticatedUserPayload = {
    sub: 'user-aux-1',
    clinicId: 'clinic-123',
    email: 'auxiliar@example.com',
    role: UserRole.AUXILIARY,
  };

  const fixedDate = new Date('2026-10-16T10:00:00.000Z');

  const sampleMaterialUsed = AttentionMaterialUsed.create({
    id: 'mat-used-1',
    clinicId: 'clinic-123',
    attentionId: 'attn-123',
    materialId: 'mat-1',
    brand: '3M',
    reference: 'Filtek Z350 XT',
    type: 'Resina compuesta',
    color: 'A2',
    toothNumber: '16',
    quantity: 1,
    notes: 'Restauración oclusal',
    createdAt: fixedDate,
  });

  const sampleAttention = ClinicalAttention.create({
    id: 'attn-123',
    clinicId: 'clinic-123',
    patientId: 'patient-123',
    clinicalHistoryId: 'hist-123',
    attendedByUserId: 'user-admin-1',
    status: ClinicalAttentionStatus.OPEN,
    proceduresPerformed: [{ code: 'RES-01', toothNumber: '16', surface: 'OCCLUSAL' }],
    evolutionNotes: 'Se realiza apertura cavitaria y obturación',
    prescription: 'Ibuprofeno 400mg',
    postOperativeIndications: 'Evitar alimentos duros',
    privateNotes: 'Paciente con ligera ansiedad',
    attendedAt: fixedDate,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    materialsUsed: [sampleMaterialUsed],
  });

  beforeEach(() => {
    createUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateClinicalAttentionUseCase>;
    updateUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateClinicalAttentionUseCase>;
    addMaterialUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddAttentionMaterialUsedUseCase>;
    closeUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CloseClinicalAttentionUseCase>;
    amendUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AmendClosedClinicalAttentionUseCase>;
    listQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListClinicalAttentionsByPatientQuery>;
    getByIdQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetClinicalAttentionByIdQuery>;
    listVersionsQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListClinicalAttentionVersionsQuery>;
    getToothMaterialHistoryQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetToothMaterialHistoryQuery>;

    controller = new ClinicalAttentionsController(
      createUseCase,
      updateUseCase,
      addMaterialUseCase,
      closeUseCase,
      amendUseCase,
      listQuery,
      getByIdQuery,
      listVersionsQuery,
      getToothMaterialHistoryQuery,
    );
  });

  it('debe registrar una nueva atención clínica llamando a create()', async () => {
    createUseCase.execute.mockResolvedValue(sampleAttention);

    const dto: CreateClinicalAttentionDto = {
      patientId: 'patient-123',
      evolutionNotes: 'Se realiza apertura cavitaria y obturación',
      prescription: 'Ibuprofeno 400mg',
      postOperativeIndications: 'Evitar alimentos duros',
      privateNotes: 'Paciente con ligera ansiedad',
      proceduresPerformed: [{ code: 'RES-01', toothNumber: '16', surface: 'OCCLUSAL' }],
      attendedAt: '2026-10-16T10:00:00.000Z',
    };

    const response = await controller.create(mockAdminUser, dto);

    expect(createUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      attendedByUserId: 'user-admin-1',
      evolutionNotes: 'Se realiza apertura cavitaria y obturación',
      prescription: 'Ibuprofeno 400mg',
      postOperativeIndications: 'Evitar alimentos duros',
      privateNotes: 'Paciente con ligera ansiedad',
      proceduresPerformed: dto.proceduresPerformed,
      attendedAt: new Date('2026-10-16T10:00:00.000Z'),
    });
    expect(response.id).toBe('attn-123');
    expect(response.evolutionNotes).toBe('Se realiza apertura cavitaria y obturación');
    expect(response.privateNotes).toBe('Paciente con ligera ansiedad');
    expect(response.materialsUsed).toHaveLength(1);
  });

  it('debe actualizar una atención clínica abierta llamando a update()', async () => {
    updateUseCase.execute.mockResolvedValue(sampleAttention);

    const dto: UpdateClinicalAttentionDto = {
      evolutionNotes: 'Se revisa obturación',
      prescription: 'Paracetamol 500mg',
      privateNotes: 'Evolución favorable',
    };

    const response = await controller.update(mockAdminUser, 'attn-123', dto);

    expect(updateUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      id: 'attn-123',
      evolutionNotes: 'Se revisa obturación',
      prescription: 'Paracetamol 500mg',
      postOperativeIndications: undefined,
      privateNotes: 'Evolución favorable',
      proceduresPerformed: undefined,
    });
    expect(response.id).toBe('attn-123');
  });

  it('debe registrar un material usado en la atención llamando a addMaterial()', async () => {
    addMaterialUseCase.execute.mockResolvedValue(sampleAttention);

    const dto: AddAttentionMaterialUsedDto = {
      materialId: 'mat-1',
      quantity: 1,
      toothNumber: '16',
      notes: 'Restauración oclusal',
    };

    const response = await controller.addMaterial(mockAdminUser, 'attn-123', dto);

    expect(addMaterialUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      attentionId: 'attn-123',
      materialId: 'mat-1',
      quantity: 1,
      toothNumber: '16',
      notes: 'Restauración oclusal',
    });
    expect(response.id).toBe('attn-123');
    expect(response.materialsUsed).toHaveLength(1);
    expect(response.materialsUsed[0].brand).toBe('3M');
  });

  it('debe listar las atenciones de un paciente pasando el viewerRole del usuario', async () => {
    listQuery.execute.mockResolvedValue([sampleAttention]);

    const response = await controller.listByPatient(mockAuxiliaryUser, 'patient-123');

    expect(listQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      viewerRole: UserRole.AUXILIARY,
    });
    expect(response).toHaveLength(1);
    expect(response[0].id).toBe('attn-123');
  });

  it('debe obtener una atención por ID pasando el viewerRole del usuario', async () => {
    getByIdQuery.execute.mockResolvedValue(sampleAttention);

    const response = await controller.getById(mockAdminUser, 'attn-123');

    expect(getByIdQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      id: 'attn-123',
      viewerRole: UserRole.ADMIN,
    });
    expect(response.id).toBe('attn-123');
  });

  it('debe cerrar una atención clínica llamando a close()', async () => {
    const closedAttention = ClinicalAttention.create({
      id: 'attn-123',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      clinicalHistoryId: 'hist-123',
      attendedByUserId: 'user-admin-1',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [{ code: 'RES-01' }],
      evolutionNotes: 'Evolución completa',
      attendedAt: fixedDate,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });
    closeUseCase.execute.mockResolvedValue(closedAttention);

    const response = await controller.close(mockAdminUser, 'attn-123');

    expect(closeUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      id: 'attn-123',
    });
    expect(response.id).toBe('attn-123');
    expect(response.status).toBe(ClinicalAttentionStatus.CLOSED);
  });

  it('debe enmendar una atención clínica cerrada llamando a amend()', async () => {
    const amendedAttention = ClinicalAttention.create({
      id: 'attn-123',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      clinicalHistoryId: 'hist-123',
      attendedByUserId: 'user-admin-1',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [{ code: 'RES-01' }],
      evolutionNotes: 'Evolución enmendada',
      attendedAt: fixedDate,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });
    amendUseCase.execute.mockResolvedValue(amendedAttention);

    const dto: AmendClinicalAttentionDto = {
      changeReason: 'Aclaración de procedimiento',
      evolutionNotes: 'Evolución enmendada',
    };

    const response = await controller.amend(mockAdminUser, 'attn-123', dto);

    expect(amendUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      id: 'attn-123',
      amendedByUserId: 'user-admin-1',
      changeReason: 'Aclaración de procedimiento',
      evolutionNotes: 'Evolución enmendada',
      prescription: undefined,
      postOperativeIndications: undefined,
      privateNotes: undefined,
      proceduresPerformed: undefined,
    });
    expect(response.id).toBe('attn-123');
    expect(response.evolutionNotes).toBe('Evolución enmendada');
  });

  it('debe listar las versiones históricas llamando a listVersions()', async () => {
    const sampleVersion = ClinicalAttentionVersion.create({
      id: 'ver-123',
      clinicId: 'clinic-123',
      attentionId: 'attn-123',
      versionNumber: 1,
      previousData: sampleAttention.toSnapshotData(),
      changeReason: 'Razón de prueba',
      amendedByUserId: 'user-admin-1',
      createdAt: fixedDate,
    });
    listVersionsQuery.execute.mockResolvedValue([sampleVersion]);

    const response = await controller.listVersions(mockAuxiliaryUser, 'attn-123');

    expect(listVersionsQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      attentionId: 'attn-123',
      viewerRole: UserRole.AUXILIARY,
    });
    expect(response).toHaveLength(1);
    expect(response[0].id).toBe('ver-123');
    expect(response[0].versionNumber).toBe(1);
  });

  it('debe consultar el historial de materiales de un diente llamando a getToothMaterialHistory()', async () => {
    const mockItems = [
      {
        attentionId: 'attn-123',
        attendedAt: fixedDate.toISOString(),
        materialId: 'mat-1',
        brand: '3M',
        reference: 'Filtek Z350 XT',
        type: 'Resina compuesta',
        color: 'A2',
        toothNumber: '16',
        quantity: 1,
        notes: 'Restauración oclusal',
      },
    ];
    getToothMaterialHistoryQuery.execute.mockResolvedValue(mockItems);

    const result = await controller.getToothMaterialHistory(mockAuxiliaryUser, 'patient-123', '16');

    expect(result).toEqual(mockItems);
    expect(getToothMaterialHistoryQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      toothNumber: '16',
    });
  });
});
