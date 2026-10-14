import { GetClinicProfileQuery, GetClinicProfileQueryRequest } from './get-clinic-profile.query';
import { ClinicRepositoryPort } from '../../domain/clinic.repository.port';
import { Clinic } from '../../domain/clinic.entity';
import { ClinicNotFoundError } from '../../domain/identity.errors';

describe('GetClinicProfileQuery', () => {
  let query: GetClinicProfileQuery;
  let mockClinicRepo: jest.Mocked<ClinicRepositoryPort>;

  const fixedDate = new Date('2026-10-13T10:00:00.000Z');

  beforeEach(() => {
    mockClinicRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    query = new GetClinicProfileQuery(mockClinicRepo);
  });

  it('debe devolver el perfil completo del consultorio solicitado', async () => {
    const clinic = Clinic.create({
      id: 'clinic-123',
      name: 'Consultorio Dental Dra. Angelee Pacheco',
      address: 'Calle 100 # 15-20',
      phone: '3001234567',
      email: 'contacto@draangelee.com',
      logoUrl: 'https://r2.draangelee.com/logo.png',
      settings: {
        operatingHours: { monday: '08:00-17:00' },
        templates: { prescriptionHeader: 'Dra. Angelee Pacheco' },
      },
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });

    mockClinicRepo.findById.mockResolvedValue(clinic);

    const request: GetClinicProfileQueryRequest = {
      clinicId: 'clinic-123',
    };

    const result = await query.execute(request);

    expect(result).toEqual({
      id: 'clinic-123',
      name: 'Consultorio Dental Dra. Angelee Pacheco',
      address: 'Calle 100 # 15-20',
      phone: '3001234567',
      email: 'contacto@draangelee.com',
      logoUrl: 'https://r2.draangelee.com/logo.png',
      settings: {
        operatingHours: { monday: '08:00-17:00' },
        templates: { prescriptionHeader: 'Dra. Angelee Pacheco' },
      },
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });
    expect(mockClinicRepo.findById).toHaveBeenCalledWith('clinic-123');
  });

  it('debe lanzar ClinicNotFoundError si el consultorio no existe', async () => {
    mockClinicRepo.findById.mockResolvedValue(null);

    const request: GetClinicProfileQueryRequest = {
      clinicId: 'clinic-not-found',
    };

    await expect(query.execute(request)).rejects.toThrow(ClinicNotFoundError);
  });
});
