import { ClinicalAttentionVersion } from './clinical-attention-version.entity';
import { InvalidClinicalAttentionDataError } from './clinical.errors';

describe('ClinicalAttentionVersion Entity', () => {
  const fixedCreatedAt = new Date('2026-10-16T14:00:00.000Z');

  const validSnapshotData = {
    proceduresPerformed: [
      {
        code: 'RES-01',
        name: 'Resina de fotocurado',
        toothNumber: '16',
        surface: 'OCCLUSAL',
      },
    ],
    evolutionNotes: 'Evolución original previa al cambio',
    prescription: 'Amoxicilina 500mg',
    postOperativeIndications: 'Reposo relativo',
    privateNotes: 'Nota confidencial sólo para odontólogo',
    attendedAt: '2026-10-16T09:00:00.000Z',
    updatedAt: '2026-10-16T10:00:00.000Z',
    materialsUsed: [
      {
        id: 'mat-used-1',
        materialId: 'mat-1',
        brand: '3M',
        reference: 'Filtek',
        type: 'Resina',
        color: 'A2',
        toothNumber: '16',
        quantity: 1,
        notes: null,
        createdAt: '2026-10-16T09:30:00.000Z',
      },
    ],
  };

  const validProps = {
    id: 'ver-1',
    clinicId: 'clinic-123',
    attentionId: 'att-123',
    versionNumber: 1,
    previousData: validSnapshotData,
    changeReason: 'Aclaración de concentración de anestésico y ajuste de evolución',
    amendedByUserId: 'usr-admin-1',
    createdAt: fixedCreatedAt,
  };

  it('debe instanciar una versión de atención clínica con datos válidos', () => {
    const version = ClinicalAttentionVersion.create(validProps);

    expect(version.id).toBe('ver-1');
    expect(version.clinicId).toBe('clinic-123');
    expect(version.attentionId).toBe('att-123');
    expect(version.versionNumber).toBe(1);
    expect(version.previousData.evolutionNotes).toBe('Evolución original previa al cambio');
    expect(version.previousData.privateNotes).toBe('Nota confidencial sólo para odontólogo');
    expect(version.changeReason).toBe(
      'Aclaración de concentración de anestésico y ajuste de evolución',
    );
    expect(version.amendedByUserId).toBe('usr-admin-1');
    expect(version.createdAt).toEqual(fixedCreatedAt);
  });

  it('debe rechazar versionNumber menor a 1 o no entero', () => {
    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        versionNumber: 0,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        versionNumber: -2,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        versionNumber: 1.5,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar changeReason vacío o compuesto solo por espacios', () => {
    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        changeReason: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        changeReason: '    ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar identificadores obligatorios vacíos o nulos', () => {
    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        id: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        clinicId: '  ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        attentionId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        amendedByUserId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar createdAt inválido', () => {
    expect(() =>
      ClinicalAttentionVersion.create({
        ...validProps,
        createdAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe garantizar la inmutabilidad de previousData mediante clonación profunda', () => {
    const mutableSnapshot = { ...validSnapshotData, proceduresPerformed: [{ code: 'MUT-01' }] };
    const version = ClinicalAttentionVersion.create({
      ...validProps,
      previousData: mutableSnapshot,
    });

    mutableSnapshot.proceduresPerformed.push({ code: 'MUT-02' });
    expect(version.previousData.proceduresPerformed).toHaveLength(1);

    const retrievedSnapshot = version.previousData;
    retrievedSnapshot.evolutionNotes = 'Modificado externamente';
    expect(version.previousData.evolutionNotes).toBe('Evolución original previa al cambio');
  });

  it('debe enmascarar privateNotes cuando el viewerRole no es ADMIN y preservarlo para ADMIN', () => {
    const version = ClinicalAttentionVersion.create(validProps);

    const maskedForAuxiliary = version.maskPrivateNotesForViewer('AUXILIARY');
    expect(maskedForAuxiliary.previousData.privateNotes).toBeNull();
    expect(maskedForAuxiliary.previousData.evolutionNotes).toBe(
      'Evolución original previa al cambio',
    );
    expect(maskedForAuxiliary.changeReason).toBe(version.changeReason);

    const preservedForAdmin = version.maskPrivateNotesForViewer('ADMIN');
    expect(preservedForAdmin.previousData.privateNotes).toBe(
      'Nota confidencial sólo para odontólogo',
    );
  });
});
