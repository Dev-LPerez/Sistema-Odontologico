import {
  UpdateClinicProfileUseCase,
  UpdateClinicProfileCommand,
} from './update-clinic-profile.use-case';
import { ClinicRepositoryPort } from '../../domain/clinic.repository.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { Clinic } from '../../domain/clinic.entity';
import { ClinicNotFoundError, InvalidClinicNameError } from '../../domain/identity.errors';

describe('UpdateClinicProfileUseCase', () => {
  let useCase: UpdateClinicProfileUseCase;
  let mockClinicRepo: jest.Mocked<ClinicRepositoryPort>;
  let mockClock: jest.Mocked<ClockPort>;

  const initialDate = new Date('2026-10-13T10:00:00.000Z');
  const updateDate = new Date('2026-10-13T12:00:00.000Z');

  const createClinic = (): Clinic =>
    Clinic.create({
      id: 'clinic-123',
      name: 'Consultorio Original',
      address: 'Dirección Antigua',
      phone: '3000000000',
      email: 'viejo@consultorio.com',
      logoUrl: null,
      settings: null,
      createdAt: initialDate,
      updatedAt: initialDate,
    });

  beforeEach(() => {
    mockClinicRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    mockClock = {
      now: jest.fn().mockReturnValue(updateDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-13'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-13 07:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new UpdateClinicProfileUseCase(mockClinicRepo, mockClock);
  });

  it('debe actualizar el perfil y la configuración del consultorio exitosamente', async () => {
    const clinic = createClinic();
    mockClinicRepo.findById.mockResolvedValue(clinic);

    const command: UpdateClinicProfileCommand = {
      clinicId: 'clinic-123',
      name: 'Consultorio Renovado Dra. Angelee',
      address: 'Carrera 7 # 72-10',
      phone: '3109876543',
      email: 'contacto@angeleedental.com',
      logoUrl: 'https://r2.angeleedental.com/brand/logo.png',
      settings: {
        operatingHours: { weekdays: '08:00-18:00' },
      },
    };

    const result = await useCase.execute(command);

    expect(result).toEqual({
      id: 'clinic-123',
      name: 'Consultorio Renovado Dra. Angelee',
      address: 'Carrera 7 # 72-10',
      phone: '3109876543',
      email: 'contacto@angeleedental.com',
      logoUrl: 'https://r2.angeleedental.com/brand/logo.png',
      settings: {
        operatingHours: { weekdays: '08:00-18:00' },
      },
      createdAt: initialDate,
      updatedAt: updateDate,
    });
    expect(mockClinicRepo.save).toHaveBeenCalledWith(clinic);
  });

  it('debe lanzar ClinicNotFoundError si el consultorio no existe', async () => {
    mockClinicRepo.findById.mockResolvedValue(null);

    const command: UpdateClinicProfileCommand = {
      clinicId: 'clinic-nonexistent',
      name: 'Nuevo Nombre',
    };

    await expect(useCase.execute(command)).rejects.toThrow(ClinicNotFoundError);
    expect(mockClinicRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar InvalidClinicNameError si se intenta actualizar con un nombre vacío', async () => {
    const clinic = createClinic();
    mockClinicRepo.findById.mockResolvedValue(clinic);

    const command: UpdateClinicProfileCommand = {
      clinicId: 'clinic-123',
      name: '   ',
    };

    await expect(useCase.execute(command)).rejects.toThrow(InvalidClinicNameError);
    expect(mockClinicRepo.save).not.toHaveBeenCalled();
  });
});
