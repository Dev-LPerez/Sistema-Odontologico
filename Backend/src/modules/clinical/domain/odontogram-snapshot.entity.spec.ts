import { OdontogramSnapshot } from './odontogram-snapshot.entity';
import { InvalidOdontogramDataError } from './clinical.errors';

describe('OdontogramSnapshot Entity', () => {
  const fixedCreatedAt = new Date('2026-10-15T12:00:00.000Z');

  it('debe crear exitosamente una instantánea inmutable del odontograma', () => {
    const rawData = {
      teeth: {
        '16': [{ surface: 'OCCLUSAL', findingCode: 'CARIES', status: 'EXISTING', notes: null }],
      },
    };

    const snapshot = OdontogramSnapshot.create({
      id: 'snap-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      odontogramId: 'odon-1',
      hasTemporalDentition: false,
      snapshotData: rawData,
      notes: 'Odontograma inicial de diagnóstico',
      createdAt: fixedCreatedAt,
    });

    expect(snapshot.id).toBe('snap-1');
    expect(snapshot.clinicId).toBe('clinic-123');
    expect(snapshot.patientId).toBe('patient-456');
    expect(snapshot.odontogramId).toBe('odon-1');
    expect(snapshot.hasTemporalDentition).toBe(false);
    expect(snapshot.notes).toBe('Odontograma inicial de diagnóstico');
    expect(snapshot.createdAt).toEqual(fixedCreatedAt);
    expect(snapshot.snapshotData).toEqual(rawData);
  });

  it('debe crear una copia profunda inmutable de snapshotData impidiendo mutaciones externas posteriores', () => {
    const rawData = {
      teeth: {
        '16': [{ surface: 'OCCLUSAL', findingCode: 'CARIES', status: 'EXISTING' }],
      },
    };

    const snapshot = OdontogramSnapshot.create({
      id: 'snap-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      odontogramId: 'odon-1',
      hasTemporalDentition: false,
      snapshotData: rawData,
      createdAt: fixedCreatedAt,
    });

    // Mutamos el objeto de origen
    rawData.teeth['16'][0].status = 'PERFORMED';
    rawData.teeth['16'][0].findingCode = 'RESIN_RESTORATION';

    // La instantánea debe preservar inalterado el estado original
    const snapshotTeeth = (snapshot.snapshotData as typeof rawData).teeth;
    expect(snapshotTeeth['16'][0].status).toBe('EXISTING');
    expect(snapshotTeeth['16'][0].findingCode).toBe('CARIES');
  });

  it('debe rechazar campos obligatorios vacíos con InvalidOdontogramDataError', () => {
    expect(() =>
      OdontogramSnapshot.create({
        id: '',
        clinicId: 'clinic-123',
        patientId: 'patient-456',
        odontogramId: 'odon-1',
        hasTemporalDentition: false,
        snapshotData: {},
        createdAt: fixedCreatedAt,
      }),
    ).toThrow(InvalidOdontogramDataError);

    expect(() =>
      OdontogramSnapshot.create({
        id: 'snap-1',
        clinicId: '',
        patientId: 'patient-456',
        odontogramId: 'odon-1',
        hasTemporalDentition: false,
        snapshotData: {},
        createdAt: fixedCreatedAt,
      }),
    ).toThrow(InvalidOdontogramDataError);
  });
});
