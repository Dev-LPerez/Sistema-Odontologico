import { PatientsController } from './patients.controller';
import { CreatePatientUseCase } from '../application/use-cases/create-patient.use-case';
import { UpdatePatientUseCase } from '../application/use-cases/update-patient.use-case';
import { ChangePatientStatusUseCase } from '../application/use-cases/change-patient-status.use-case';
import { GetPatientByIdQuery } from '../application/queries/get-patient-by-id.query';
import { ListPatientsQuery } from '../application/queries/list-patients.query';
import { DetectDuplicatePatientsQuery } from '../application/queries/detect-duplicate-patients.query';
import { SearchPatientsQuery } from '../application/queries/search-patients.query';
import { UserRole } from '../../identity';
import { DocumentType } from '../domain/document-type.enum';
import { AcquisitionSource } from '../domain/acquisition-source.enum';
import { AuthenticatedUserPayload } from '../../../shared/presentation/decorators/current-user.decorator';

describe('PatientsController', () => {
  let controller: PatientsController;
  let createPatientUseCase: jest.Mocked<CreatePatientUseCase>;
  let updatePatientUseCase: jest.Mocked<UpdatePatientUseCase>;
  let changePatientStatusUseCase: jest.Mocked<ChangePatientStatusUseCase>;
  let getPatientByIdQuery: jest.Mocked<GetPatientByIdQuery>;
  let listPatientsQuery: jest.Mocked<ListPatientsQuery>;
  let detectDuplicatePatientsQuery: jest.Mocked<DetectDuplicatePatientsQuery>;
  let searchPatientsQuery: jest.Mocked<SearchPatientsQuery>;

  const mockUser: AuthenticatedUserPayload = {
    sub: 'user-1',
    clinicId: 'clinic-123',
    email: 'dra@example.com',
    role: UserRole.ADMIN,
  };

  const sampleResult = {
    id: 'patient-123',
    clinicId: 'clinic-123',
    firstName: 'Carlos',
    lastName: 'Gómez',
    documentType: DocumentType.CC,
    documentNumber: '1020304050',
    birthDate: new Date('1990-05-15T00:00:00.000Z'),
    phone: '3001234567',
    email: 'carlos@example.com',
    address: 'Calle 100 # 15-20',
    emergencyContactName: 'María Gómez',
    emergencyContactPhone: '3109876543',
    acquisitionSource: AcquisitionSource.INSTAGRAM,
    dataTreatmentConsent: true,
    dataTreatmentConsentAt: new Date('2026-10-14T10:00:00.000Z'),
    isActive: true,
    createdAt: new Date('2026-10-14T10:00:00.000Z'),
    updatedAt: new Date('2026-10-14T10:00:00.000Z'),
  };

  beforeEach(async () => {
    createPatientUseCase = {
      execute: jest.fn().mockResolvedValue(sampleResult),
    } as unknown as jest.Mocked<CreatePatientUseCase>;

    updatePatientUseCase = {
      execute: jest.fn().mockResolvedValue(sampleResult),
    } as unknown as jest.Mocked<UpdatePatientUseCase>;

    changePatientStatusUseCase = {
      execute: jest.fn().mockResolvedValue({ ...sampleResult, isActive: false }),
    } as unknown as jest.Mocked<ChangePatientStatusUseCase>;

    getPatientByIdQuery = {
      execute: jest.fn().mockResolvedValue(sampleResult),
    } as unknown as jest.Mocked<GetPatientByIdQuery>;

    listPatientsQuery = {
      execute: jest.fn().mockResolvedValue([sampleResult]),
    } as unknown as jest.Mocked<ListPatientsQuery>;

    detectDuplicatePatientsQuery = {
      execute: jest.fn().mockResolvedValue([{ ...sampleResult, matchReason: 'PHONE' }]),
    } as unknown as jest.Mocked<DetectDuplicatePatientsQuery>;

    searchPatientsQuery = {
      execute: jest.fn().mockResolvedValue([sampleResult]),
    } as unknown as jest.Mocked<SearchPatientsQuery>;

    controller = new PatientsController(
      createPatientUseCase,
      updatePatientUseCase,
      changePatientStatusUseCase,
      getPatientByIdQuery,
      listPatientsQuery,
      detectDuplicatePatientsQuery,
      searchPatientsQuery,
    );
  });

  it('debe crear un paciente delegando a CreatePatientUseCase con el clinicId autenticado', async () => {
    const dto = {
      firstName: 'Carlos',
      lastName: 'Gómez',
      documentType: DocumentType.CC,
      documentNumber: '1020304050',
      birthDate: '1990-05-15',
      phone: '3001234567',
      dataTreatmentConsent: true,
    };

    const res = await controller.create(mockUser, dto);
    expect(res).toEqual(sampleResult);
    expect(createPatientUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      ...dto,
    });
  });

  it('debe listar pacientes delegando a ListPatientsQuery', async () => {
    const res = await controller.list(mockUser, 'true');
    expect(res).toEqual([sampleResult]);
    expect(listPatientsQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      isActive: true,
    });
  });

  it('debe consultar por id delegando a GetPatientByIdQuery', async () => {
    const res = await controller.getById(mockUser, 'patient-123');
    expect(res).toEqual(sampleResult);
    expect(getPatientByIdQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
    });
  });

  it('debe actualizar paciente delegando a UpdatePatientUseCase', async () => {
    const dto = { firstName: 'Carlos Alberto' };
    const res = await controller.update(mockUser, 'patient-123', dto);
    expect(res).toEqual(sampleResult);
    expect(updatePatientUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      ...dto,
    });
  });

  it('debe cambiar estado delegando a ChangePatientStatusUseCase', async () => {
    const dto = { isActive: false };
    const res = await controller.changeStatus(mockUser, 'patient-123', dto);
    expect(res.isActive).toBe(false);
    expect(changePatientStatusUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      isActive: false,
    });
  });

  it('debe verificar duplicados delegando a DetectDuplicatePatientsQuery', async () => {
    const res = await controller.checkDuplicates(mockUser, {
      phone: '3001234567',
    });
    expect(res).toHaveLength(1);
    expect(detectDuplicatePatientsQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      documentNumber: undefined,
      phone: '3001234567',
      excludePatientId: undefined,
    });
  });

  it('debe buscar pacientes delegando a SearchPatientsQuery', async () => {
    const res = await controller.search(mockUser, {
      q: 'Carls Gomz',
      limit: 10,
      includeInactive: true,
    });
    expect(res).toEqual([sampleResult]);
    expect(searchPatientsQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      q: 'Carls Gomz',
      limit: 10,
      includeInactive: true,
    });
  });
});
