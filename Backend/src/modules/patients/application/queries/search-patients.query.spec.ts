import { SearchPatientsQuery } from './search-patients.query';
import { PatientQueriesPort, PatientSearchItemDto } from '../ports/patient.queries.port';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';

describe('SearchPatientsQuery', () => {
  let query: SearchPatientsQuery;
  let mockQueriesPort: jest.Mocked<PatientQueriesPort>;

  const fixedNow = new Date('2026-10-14T10:00:00.000Z');

  const samplePatient: PatientSearchItemDto = {
    id: 'patient-123',
    clinicId: 'clinic-123',
    firstName: 'Carlos',
    lastName: 'Gómez',
    documentType: DocumentType.CC,
    documentNumber: '1020304050',
    birthDate: new Date('1990-05-15T00:00:00.000Z'),
    phone: '+573001234567',
    email: 'carlos@example.com',
    address: 'Calle 100 # 15-20',
    emergencyContactName: 'María Gómez',
    emergencyContactPhone: '+573109876543',
    acquisitionSource: AcquisitionSource.INSTAGRAM,
    dataTreatmentConsent: true,
    dataTreatmentConsentAt: fixedNow,
    isActive: true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  };

  beforeEach(() => {
    mockQueriesPort = {
      searchByTrigram: jest.fn(),
    };

    query = new SearchPatientsQuery(mockQueriesPort);
  });

  it('debe encontrar pacientes por nombre tolerando errores tipográficos y omisión de tildes ordenando por relevancia dentro del mismo clinicId', async () => {
    mockQueriesPort.searchByTrigram.mockResolvedValue([samplePatient]);

    const result = await query.execute({
      clinicId: 'clinic-123',
      q: 'Carls Gomz',
    });

    expect(result).toEqual([samplePatient]);
    expect(mockQueriesPort.searchByTrigram).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      query: 'Carls Gomz',
      normalizedDigits: undefined,
      includeInactive: false,
      limit: 20,
    });
  });

  it('debe encontrar pacientes por fragmento de documento o teléfono normalizando guiones y espacios', async () => {
    mockQueriesPort.searchByTrigram.mockResolvedValue([samplePatient]);

    const result = await query.execute({
      clinicId: 'clinic-123',
      q: ' 300-123 45 ',
    });

    expect(result).toEqual([samplePatient]);
    expect(mockQueriesPort.searchByTrigram).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      query: '300-123 45',
      normalizedDigits: '30012345',
      includeInactive: false,
      limit: 20,
    });
  });

  it('debe retornar un array vacío sin llamar al puerto si el término de búsqueda tiene menos de 2 caracteres', async () => {
    const resultEmpty = await query.execute({
      clinicId: 'clinic-123',
      q: '   ',
    });
    const resultOneChar = await query.execute({
      clinicId: 'clinic-123',
      q: ' C ',
    });

    expect(resultEmpty).toEqual([]);
    expect(resultOneChar).toEqual([]);
    expect(mockQueriesPort.searchByTrigram).not.toHaveBeenCalled();
  });

  it('debe aplicar un límite por defecto de 20 si no se especifica y respetar el tope máximo de 50', async () => {
    mockQueriesPort.searchByTrigram.mockResolvedValue([]);

    await query.execute({
      clinicId: 'clinic-123',
      q: 'Carlos',
      limit: 100,
    });

    expect(mockQueriesPort.searchByTrigram).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );

    await query.execute({
      clinicId: 'clinic-123',
      q: 'Carlos',
      limit: -5,
    });

    expect(mockQueriesPort.searchByTrigram).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
    );
  });

  it('debe propagar el flag includeInactive al puerto cuando es true', async () => {
    mockQueriesPort.searchByTrigram.mockResolvedValue([]);

    await query.execute({
      clinicId: 'clinic-123',
      q: 'Laura',
      includeInactive: true,
    });

    expect(mockQueriesPort.searchByTrigram).toHaveBeenCalledWith(
      expect.objectContaining({ includeInactive: true }),
    );
  });
});
