import { Odontogram } from './odontogram.entity';
import { ToothFinding } from './tooth-finding.vo';
import { ToothNumber } from './tooth-number.vo';
import { ToothSurface } from './tooth-surface.enum';
import { FindingCatalogCode } from './finding-catalog.enum';
import { FindingStatus } from './finding-status.enum';
import { InvalidOdontogramDataError } from './clinical.errors';

describe('Odontogram Aggregate Root', () => {
  const fixedCreatedAt = new Date('2026-10-15T10:00:00.000Z');
  const fixedUpdatedAt = new Date('2026-10-15T10:00:00.000Z');

  it('debe crear un odontograma activo solo con dentición permanente por defecto', () => {
    const finding16 = ToothFinding.create({
      toothNumber: ToothNumber.of(16),
      surface: ToothSurface.OCCLUSAL,
      findingCode: FindingCatalogCode.CARIES,
      status: FindingStatus.EXISTING,
    });

    const odontogram = Odontogram.create({
      id: 'odon-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      hasTemporalDentition: false,
      findings: [finding16],
      createdAt: fixedCreatedAt,
      updatedAt: fixedUpdatedAt,
    });

    expect(odontogram.id).toBe('odon-1');
    expect(odontogram.clinicId).toBe('clinic-123');
    expect(odontogram.patientId).toBe('patient-456');
    expect(odontogram.hasTemporalDentition).toBe(false);
    expect(odontogram.findings).toHaveLength(1);
    expect(odontogram.findings[0].toothNumber.value).toBe(16);
  });

  it('debe permitir hallazgos en piezas permanentes y temporales cuando hasTemporalDentition es true', () => {
    const finding16 = ToothFinding.create({
      toothNumber: ToothNumber.of(16),
      surface: ToothSurface.OCCLUSAL,
      findingCode: FindingCatalogCode.CARIES,
      status: FindingStatus.EXISTING,
    });
    const finding55 = ToothFinding.create({
      toothNumber: ToothNumber.of(55),
      surface: ToothSurface.VESTIBULAR,
      findingCode: FindingCatalogCode.RESIN_RESTORATION,
      status: FindingStatus.PERFORMED,
    });

    const odontogram = Odontogram.create({
      id: 'odon-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      hasTemporalDentition: true,
      findings: [finding16, finding55],
      createdAt: fixedCreatedAt,
      updatedAt: fixedUpdatedAt,
    });

    expect(odontogram.hasTemporalDentition).toBe(true);
    expect(odontogram.findings).toHaveLength(2);
  });

  it('debe lanzar InvalidOdontogramDataError cuando el número de diente FDI es inválido o se registra un diente temporal con hasTemporalDentition en false', () => {
    const findingTemporal = ToothFinding.create({
      toothNumber: ToothNumber.of(55),
      surface: ToothSurface.VESTIBULAR,
      findingCode: FindingCatalogCode.RESIN_RESTORATION,
      status: FindingStatus.PERFORMED,
    });

    expect(() =>
      Odontogram.create({
        id: 'odon-1',
        clinicId: 'clinic-123',
        patientId: 'patient-456',
        hasTemporalDentition: false,
        findings: [findingTemporal],
        createdAt: fixedCreatedAt,
        updatedAt: fixedUpdatedAt,
      }),
    ).toThrow(InvalidOdontogramDataError);
  });

  it('debe actualizar los hallazgos y actualizar el timestamp de modificación', () => {
    const odontogram = Odontogram.create({
      id: 'odon-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      hasTemporalDentition: true,
      findings: [],
      createdAt: fixedCreatedAt,
      updatedAt: fixedUpdatedAt,
    });

    const newFindings = [
      ToothFinding.create({
        toothNumber: ToothNumber.of(21),
        surface: ToothSurface.MESIAL,
        findingCode: FindingCatalogCode.CARIES,
        status: FindingStatus.PLANNED,
      }),
    ];
    const newUpdatedAt = new Date('2026-10-15T11:00:00.000Z');

    odontogram.updateFindings(newFindings, true, newUpdatedAt);

    expect(odontogram.findings).toHaveLength(1);
    expect(odontogram.findings[0].toothNumber.value).toBe(21);
    expect(odontogram.updatedAt).toEqual(newUpdatedAt);
  });

  it('debe rechazar la actualización si se intenta desactivar hasTemporalDentition cuando existen hallazgos temporales', () => {
    const findingTemporal = ToothFinding.create({
      toothNumber: ToothNumber.of(55),
      surface: ToothSurface.VESTIBULAR,
      findingCode: FindingCatalogCode.RESIN_RESTORATION,
      status: FindingStatus.PERFORMED,
    });

    const odontogram = Odontogram.create({
      id: 'odon-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      hasTemporalDentition: true,
      findings: [findingTemporal],
      createdAt: fixedCreatedAt,
      updatedAt: fixedUpdatedAt,
    });

    expect(() => odontogram.updateFindings([findingTemporal], false, new Date())).toThrow(
      InvalidOdontogramDataError,
    );
  });

  it('debe generar la representación determinista toStructuredJson()', () => {
    const finding16 = ToothFinding.create({
      toothNumber: ToothNumber.of(16),
      surface: ToothSurface.OCCLUSAL,
      findingCode: FindingCatalogCode.CARIES,
      status: FindingStatus.EXISTING,
      notes: 'Fosa distal',
    });

    const odontogram = Odontogram.create({
      id: 'odon-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      hasTemporalDentition: false,
      findings: [finding16],
      createdAt: fixedCreatedAt,
      updatedAt: fixedUpdatedAt,
    });

    const structured = odontogram.toStructuredJson();
    expect(structured).toHaveProperty('teeth');
    expect(structured.teeth['16']).toBeDefined();
    expect(structured.teeth['16']).toHaveLength(1);
    expect(structured.teeth['16'][0].findingCode).toBe('CARIES');
    expect(structured.teeth['16'][0].surface).toBe('OCCLUSAL');
  });
});
