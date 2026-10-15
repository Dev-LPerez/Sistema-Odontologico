import { ClinicalHistory } from './clinical-history.entity';
import { MedicalAntecedents } from './medical-antecedents.vo';
import { TreatmentPlanItem } from './treatment-plan-item.entity';
import { TreatmentItemStatus } from './treatment-item-status.enum';
import { InvalidClinicalHistoryDataError, TreatmentPlanItemNotFoundError } from './clinical.errors';

describe('ClinicalHistory AggregateRoot', () => {
  const antecedents = MedicalAntecedents.create({
    hypertension: false,
    diabetes: false,
    allergies: true,
    allergiesDetails: 'Penicilina',
    medications: false,
    medicationsDetails: null,
    bleedingDisorders: false,
    pregnancy: false,
    otherNotes: null,
    familyAntecedents: 'Sin antecedentes relevantes',
  });

  const defaultProps = {
    id: 'hist-1',
    clinicId: 'clinic-1',
    patientId: 'patient-1',
    chiefComplaint: 'Dolor en molar superior',
    currentIllness: 'Presenta molestia al masticar desde hace una semana',
    medicalAntecedents: antecedents,
    clinicalExamination: 'Caries en pieza 16 cara oclusal',
    diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
    createdAt: new Date('2026-10-15T09:00:00.000Z'),
    updatedAt: new Date('2026-10-15T09:00:00.000Z'),
  };

  it('debe crear una historia clínica válida con datos correctos y costo inicial cero', () => {
    const history = ClinicalHistory.create(defaultProps);

    expect(history.id).toBe('hist-1');
    expect(history.clinicId).toBe('clinic-1');
    expect(history.patientId).toBe('patient-1');
    expect(history.chiefComplaint).toBe('Dolor en molar superior');
    expect(history.currentIllness).toBe('Presenta molestia al masticar desde hace una semana');
    expect(history.medicalAntecedents).toEqual(antecedents);
    expect(history.clinicalExamination).toBe('Caries en pieza 16 cara oclusal');
    expect(history.diagnoses).toEqual([{ code: 'K02.1', description: 'Caries de la dentina' }]);
    expect(history.treatmentItems).toHaveLength(0);
    expect(history.totalEstimatedCostCop).toBe(0);
  });

  it('debe lanzar InvalidClinicalHistoryDataError cuando allergies o medications es true sin detalle o chiefComplaint está vacío', () => {
    // chiefComplaint vacío
    expect(() =>
      ClinicalHistory.create({
        ...defaultProps,
        chiefComplaint: '',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      ClinicalHistory.create({
        ...defaultProps,
        chiefComplaint: '    ',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    // currentIllness vacío
    expect(() =>
      ClinicalHistory.create({
        ...defaultProps,
        currentIllness: '',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    // Alergia true sin detalle en antecedentes
    expect(() =>
      MedicalAntecedents.create({
        hypertension: false,
        diabetes: false,
        allergies: true,
        allergiesDetails: '   ',
        medications: false,
        medicationsDetails: null,
        bleedingDisorders: false,
        pregnancy: false,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe agregar ítems al plan de tratamiento y calcular totalEstimatedCostCop correctamente', () => {
    const history = ClinicalHistory.create(defaultProps);

    const item1 = TreatmentPlanItem.create({
      id: 'item-1',
      clinicId: 'clinic-1',
      clinicalHistoryId: 'hist-1',
      procedureId: 'proc-1',
      procedureCode: 'RES-EST',
      procedureName: 'Resina Estética',
      toothNumber: '16',
      status: TreatmentItemStatus.PENDING,
      estimatedCostCop: 120000,
      notes: null,
      createdAt: new Date('2026-10-15T09:30:00.000Z'),
      updatedAt: new Date('2026-10-15T09:30:00.000Z'),
    });

    const item2 = TreatmentPlanItem.create({
      id: 'item-2',
      clinicId: 'clinic-1',
      clinicalHistoryId: 'hist-1',
      procedureId: 'proc-2',
      procedureCode: 'DETARTR',
      procedureName: 'Detartraje Subgingival',
      toothNumber: null,
      status: TreatmentItemStatus.PENDING,
      estimatedCostCop: 80000,
      notes: 'Limpieza profunda',
      createdAt: new Date('2026-10-15T09:35:00.000Z'),
      updatedAt: new Date('2026-10-15T09:35:00.000Z'),
    });

    history.addTreatmentPlanItem(item1);
    history.addTreatmentPlanItem(item2);

    expect(history.treatmentItems).toHaveLength(2);
    expect(history.totalEstimatedCostCop).toBe(200000);
  });

  it('debe actualizar el estado de un ítem del plan de tratamiento', () => {
    const history = ClinicalHistory.create(defaultProps);

    const item = TreatmentPlanItem.create({
      id: 'item-1',
      clinicId: 'clinic-1',
      clinicalHistoryId: 'hist-1',
      procedureId: 'proc-1',
      procedureCode: 'RES-EST',
      procedureName: 'Resina Estética',
      toothNumber: '16',
      status: TreatmentItemStatus.PENDING,
      estimatedCostCop: 120000,
      notes: null,
      createdAt: new Date('2026-10-15T09:30:00.000Z'),
      updatedAt: new Date('2026-10-15T09:30:00.000Z'),
    });

    history.addTreatmentPlanItem(item);

    const updateDate = new Date('2026-10-15T11:00:00.000Z');
    history.updateTreatmentPlanItemStatus('item-1', TreatmentItemStatus.COMPLETED, updateDate);

    expect(history.treatmentItems[0].status).toBe(TreatmentItemStatus.COMPLETED);
    expect(history.treatmentItems[0].updatedAt).toEqual(updateDate);
  });

  it('debe lanzar TreatmentPlanItemNotFoundError al intentar actualizar un ítem inexistente', () => {
    const history = ClinicalHistory.create(defaultProps);

    expect(() =>
      history.updateTreatmentPlanItemStatus(
        'item-inexistente',
        TreatmentItemStatus.COMPLETED,
        new Date(),
      ),
    ).toThrow(TreatmentPlanItemNotFoundError);
  });

  it('debe actualizar los datos de la historia clínica correctamente', () => {
    const history = ClinicalHistory.create(defaultProps);
    const newDate = new Date('2026-10-15T12:00:00.000Z');

    history.update({
      chiefComplaint: 'Revisión y cambio de resina',
      currentIllness: 'Sin molestia actual',
      clinicalExamination: 'Resina desadaptada en 16',
      diagnoses: [{ code: 'K02.2', description: 'Caries recurrente' }],
      updatedAt: newDate,
    });

    expect(history.chiefComplaint).toBe('Revisión y cambio de resina');
    expect(history.currentIllness).toBe('Sin molestia actual');
    expect(history.clinicalExamination).toBe('Resina desadaptada en 16');
    expect(history.diagnoses).toEqual([{ code: 'K02.2', description: 'Caries recurrente' }]);
    expect(history.updatedAt).toEqual(newDate);
  });

  it('debe rechazar datos inválidos en creación, actualización y plan de tratamiento', () => {
    // Sin medicalAntecedents
    expect(() =>
      ClinicalHistory.create({
        ...defaultProps,
        medicalAntecedents: null as unknown as MedicalAntecedents,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    const history = ClinicalHistory.create(defaultProps);

    // Update con medicalAntecedents inválido
    expect(() =>
      history.update({
        medicalAntecedents: {} as unknown as MedicalAntecedents,
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    // Update con diagnoses no arreglo
    expect(() =>
      history.update({
        diagnoses: 'no-array' as unknown as unknown[],
        updatedAt: new Date(),
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    // Add treatment item inválido
    expect(() => history.addTreatmentPlanItem(null as unknown as TreatmentPlanItem)).toThrow(
      InvalidClinicalHistoryDataError,
    );

    // Update con medicalAntecedents válido y clinicalExamination null
    history.update({
      medicalAntecedents: antecedents,
      clinicalExamination: null,
      updatedAt: new Date(),
    });
    expect(history.clinicalExamination).toBeNull();
  });
});
