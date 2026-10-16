import { ClinicalHistoryVersion } from './clinical-history-version.entity';
import { ClinicalHistory } from './clinical-history.entity';
import { MedicalAntecedents } from './medical-antecedents.vo';
import { TreatmentPlanItem } from './treatment-plan-item.entity';
import { TreatmentItemStatus } from './treatment-item-status.enum';
import { InvalidClinicalHistoryDataError } from './clinical.errors';

describe('ClinicalHistoryVersion Entity', () => {
  const fixedCreatedAt = new Date('2026-10-16T14:00:00.000Z');

  const validSnapshotData = {
    chiefComplaint: 'Dolor inicial',
    currentIllness: 'Evolución de 3 días con dolor agudo',
    personalAntecedents: {
      hypertension: false,
      diabetes: false,
      allergies: false,
      allergiesDetails: null,
      medications: false,
      medicationsDetails: null,
      bleedingDisorders: false,
      pregnancy: false,
      otherNotes: null,
    },
    familyAntecedents: 'Sin antecedentes relevantes',
    clinicalExamination: 'Examen normal',
    diagnoses: ['K02.1 - Caries de la dentina'],
    treatmentItems: [],
    updatedAt: '2026-10-16T10:00:00.000Z',
  };

  const validProps = {
    id: 'ch-ver-1',
    clinicId: 'clinic-123',
    clinicalHistoryId: 'history-123',
    versionNumber: 1,
    previousData: validSnapshotData,
    changeReason: 'Actualización tras consulta de control',
    updatedByUserId: 'usr-admin-1',
    createdAt: fixedCreatedAt,
  };

  it('debe instanciar una versión de historia clínica con datos válidos', () => {
    const version = ClinicalHistoryVersion.create(validProps);

    expect(version.id).toBe('ch-ver-1');
    expect(version.clinicId).toBe('clinic-123');
    expect(version.clinicalHistoryId).toBe('history-123');
    expect(version.versionNumber).toBe(1);
    expect(version.previousData.chiefComplaint).toBe('Dolor inicial');
    expect(version.changeReason).toBe('Actualización tras consulta de control');
    expect(version.updatedByUserId).toBe('usr-admin-1');
    expect(version.createdAt).toEqual(fixedCreatedAt);
  });

  it('debe permitir changeReason y updatedByUserId opcionales o nulos', () => {
    const version = ClinicalHistoryVersion.create({
      ...validProps,
      changeReason: undefined,
      updatedByUserId: undefined,
    });

    expect(version.changeReason).toBeNull();
    expect(version.updatedByUserId).toBeNull();
  });

  it('debe rechazar cuando id, clinicId o clinicalHistoryId son inválidos o vacíos', () => {
    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        id: '',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        clinicId: '   ',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        clinicalHistoryId: '',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe rechazar versionNumber menor a 1 o no entero', () => {
    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        versionNumber: 0,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        versionNumber: -1,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        versionNumber: 2.7,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe rechazar previousData cuando no es un objeto válido', () => {
    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        previousData: null as unknown as Record<string, unknown>,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        previousData: 'string' as unknown as Record<string, unknown>,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        previousData: [] as unknown as Record<string, unknown>,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe rechazar createdAt inválido', () => {
    expect(() =>
      ClinicalHistoryVersion.create({
        ...validProps,
        createdAt: new Date('invalid-date'),
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe mantener inmutables los datos de previousData mediante clonado', () => {
    const mutableData = {
      ...validSnapshotData,
      diagnoses: ['Diagnóstico original'],
    };

    const version = ClinicalHistoryVersion.create({
      ...validProps,
      previousData: mutableData,
    });

    mutableData.diagnoses.push('Diagnóstico modificado después');

    expect((version.previousData.diagnoses as string[]).length).toBe(1);
    expect((version.previousData.diagnoses as string[])[0]).toBe('Diagnóstico original');
  });

  it('ClinicalHistory.toSnapshotData debe capturar el estado completo de la historia clínica', () => {
    const antecedents = MedicalAntecedents.create({
      hypertension: true,
      diabetes: false,
      allergies: true,
      allergiesDetails: 'Penicilina',
      medications: false,
      bleedingDisorders: false,
      pregnancy: false,
      familyAntecedents: 'Madre hipertensa',
    });

    const item = TreatmentPlanItem.create({
      id: 'item-1',
      clinicId: 'clinic-123',
      clinicalHistoryId: 'hist-1',
      procedureId: 'proc-1',
      procedureCode: 'RES-01',
      procedureName: 'Resina',
      toothNumber: '16',
      status: TreatmentItemStatus.PENDING,
      estimatedCostCop: 120000,
      createdAt: fixedCreatedAt,
      updatedAt: fixedCreatedAt,
    });

    const history = ClinicalHistory.create({
      id: 'hist-1',
      clinicId: 'clinic-123',
      patientId: 'pat-1',
      chiefComplaint: 'Dolor inicial',
      currentIllness: 'Caries activa',
      medicalAntecedents: antecedents,
      diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
      treatmentItems: [item],
      createdAt: fixedCreatedAt,
      updatedAt: fixedCreatedAt,
    });

    const snapshot = history.toSnapshotData();

    expect(snapshot.chiefComplaint).toBe('Dolor inicial');
    expect(snapshot.currentIllness).toBe('Caries activa');
    expect(snapshot.personalAntecedents.hypertension).toBe(true);
    expect(snapshot.personalAntecedents.allergiesDetails).toBe('Penicilina');
    expect(snapshot.familyAntecedents).toBe('Madre hipertensa');
    expect(snapshot.diagnoses).toEqual([{ code: 'K02.1', description: 'Caries de la dentina' }]);
    expect(snapshot.treatmentItems.length).toBe(1);
    expect(snapshot.treatmentItems[0].procedureCode).toBe('RES-01');
    expect(snapshot.updatedAt).toBe(fixedCreatedAt.toISOString());
  });
});
