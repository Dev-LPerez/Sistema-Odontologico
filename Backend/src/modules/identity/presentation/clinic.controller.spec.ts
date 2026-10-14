import { ClinicController } from './clinic.controller';
import { GetClinicProfileQuery } from '../application/queries/get-clinic-profile.query';
import { UpdateClinicProfileUseCase } from '../application/use-cases/update-clinic-profile.use-case';

describe('ClinicController', () => {
  let controller: ClinicController;
  let mockGetClinicProfileQuery: jest.Mocked<GetClinicProfileQuery>;
  let mockUpdateClinicProfileUseCase: jest.Mocked<UpdateClinicProfileUseCase>;

  const fixedDate = new Date('2026-10-13T10:00:00.000Z');

  beforeEach(() => {
    mockGetClinicProfileQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetClinicProfileQuery>;

    mockUpdateClinicProfileUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateClinicProfileUseCase>;

    controller = new ClinicController(mockGetClinicProfileQuery, mockUpdateClinicProfileUseCase);
  });

  describe('getProfile', () => {
    it('debe invocar GetClinicProfileQuery con el clinicId autenticado', async () => {
      const mockClinic = {
        id: 'clinic-123',
        name: 'Consultorio Dental Dra. Angelee',
        address: 'Calle 100 # 15-20',
        phone: '+573001234567',
        email: 'contacto@draangelee.com',
        logoUrl: 'https://r2.draangelee.com/logo.png',
        settings: { timezone: 'America/Bogota' },
        createdAt: fixedDate,
        updatedAt: fixedDate,
      };
      mockGetClinicProfileQuery.execute.mockResolvedValue(mockClinic);

      const result = await controller.getProfile('clinic-123');

      expect(mockGetClinicProfileQuery.execute).toHaveBeenCalledWith({ clinicId: 'clinic-123' });
      expect(result).toBe(mockClinic);
    });
  });

  describe('updateProfile', () => {
    it('debe invocar UpdateClinicProfileUseCase con clinicId y los campos a actualizar', async () => {
      const dto = {
        name: 'Nuevo Nombre Consultorio',
        phone: '+573109998877',
      };
      const mockUpdated = {
        id: 'clinic-123',
        name: 'Nuevo Nombre Consultorio',
        address: 'Calle 100 # 15-20',
        phone: '+573109998877',
        email: 'contacto@draangelee.com',
        logoUrl: 'https://r2.draangelee.com/logo.png',
        settings: { timezone: 'America/Bogota' },
        createdAt: fixedDate,
        updatedAt: fixedDate,
      };
      mockUpdateClinicProfileUseCase.execute.mockResolvedValue(mockUpdated);

      const result = await controller.updateProfile('clinic-123', dto);

      expect(mockUpdateClinicProfileUseCase.execute).toHaveBeenCalledWith({
        clinicId: 'clinic-123',
        ...dto,
      });
      expect(result).toBe(mockUpdated);
    });
  });
});
