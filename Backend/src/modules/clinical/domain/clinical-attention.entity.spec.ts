import { ClinicalAttention } from './clinical-attention.entity';
import { ClinicalAttentionStatus } from './clinical-attention-status.enum';
import {
  InvalidClinicalAttentionDataError,
  InvalidOdontogramDataError,
  ClinicalAttentionClosedError,
  IncompleteClinicalAttentionError,
  ClinicalAttentionNotClosedError,
} from './clinical.errors';
import { AttentionMaterialUsed } from './attention-material-used.entity';
import { AttentionClosedEvent } from './attention-closed.event';
import { ToothSurface } from './tooth-surface.enum';

describe('ClinicalAttention Aggregate', () => {
  const fixedAttendedAt = new Date('2026-10-16T09:00:00.000Z');
  const fixedCreatedAt = new Date('2026-10-16T09:05:00.000Z');
  const fixedUpdatedAt = new Date('2026-10-16T09:05:00.000Z');

  const validProps = {
    id: 'att-1',
    clinicId: 'clinic-123',
    patientId: 'pat-123',
    clinicalHistoryId: 'hist-123',
    attendedByUserId: 'usr-123',
    status: ClinicalAttentionStatus.OPEN,
    proceduresPerformed: [
      {
        code: 'RES-01',
        name: 'Resina de fotocurado',
        toothNumber: '16',
        surface: 'OCCLUSAL',
      },
    ],
    evolutionNotes: 'Se realiza apertura cavitaria y obturación con resina en pieza 16',
    prescription: 'Ibuprofeno 400mg cada 8 horas por 3 días',
    postOperativeIndications: 'Evitar alimentos duros y calientes durante las primeras 2 horas',
    privateNotes: 'Paciente con ansiedad dental moderada',
    attendedAt: fixedAttendedAt,
    createdAt: fixedCreatedAt,
    updatedAt: fixedUpdatedAt,
    materialsUsed: [],
  };

  it('debe crear una atención clínica con datos válidos completos', () => {
    const attention = ClinicalAttention.create(validProps);

    expect(attention.id).toBe('att-1');
    expect(attention.clinicId).toBe('clinic-123');
    expect(attention.patientId).toBe('pat-123');
    expect(attention.clinicalHistoryId).toBe('hist-123');
    expect(attention.attendedByUserId).toBe('usr-123');
    expect(attention.status).toBe(ClinicalAttentionStatus.OPEN);
    expect(attention.proceduresPerformed).toHaveLength(1);
    expect(attention.proceduresPerformed[0].code).toBe('RES-01');
    expect(attention.evolutionNotes).toBe(
      'Se realiza apertura cavitaria y obturación con resina en pieza 16',
    );
    expect(attention.prescription).toBe('Ibuprofeno 400mg cada 8 horas por 3 días');
    expect(attention.postOperativeIndications).toBe(
      'Evitar alimentos duros y calientes durante las primeras 2 horas',
    );
    expect(attention.privateNotes).toBe('Paciente con ansiedad dental moderada');
    expect(attention.attendedAt).toEqual(fixedAttendedAt);
    expect(attention.createdAt).toEqual(fixedCreatedAt);
    expect(attention.updatedAt).toEqual(fixedUpdatedAt);
    expect(attention.materialsUsed).toEqual([]);
  });

  it('debe permitir crear una atención con campos opcionales en null o undefined', () => {
    const attention = ClinicalAttention.create({
      ...validProps,
      prescription: null,
      postOperativeIndications: null,
      privateNotes: null,
      proceduresPerformed: [],
      materialsUsed: undefined,
    });

    expect(attention.prescription).toBeNull();
    expect(attention.postOperativeIndications).toBeNull();
    expect(attention.privateNotes).toBeNull();
    expect(attention.proceduresPerformed).toEqual([]);
    expect(attention.materialsUsed).toEqual([]);
  });

  it('debe lanzar InvalidClinicalAttentionDataError cuando evolutionNotes está vacío o ClinicalHistoryNotFoundError si no hay historia clínica', () => {
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        evolutionNotes: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        evolutionNotes: '     ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar identificadores obligatorios vacíos', () => {
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        id: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        clinicId: '  ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        patientId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        clinicalHistoryId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        attendedByUserId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar fechas inválidas en attendedAt, createdAt y updatedAt', () => {
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        attendedAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        createdAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        updatedAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe actualizar los datos de una atención clínica abierta y renovar updatedAt', () => {
    const attention = ClinicalAttention.create(validProps);
    const newUpdatedAt = new Date('2026-10-16T11:00:00.000Z');

    attention.update({
      evolutionNotes: 'Evolución actualizada con pulido final',
      prescription: null,
      postOperativeIndications: 'Indicaciones actualizadas',
      privateNotes: 'Nueva nota privada',
      proceduresPerformed: [
        {
          code: 'PUL-01',
          name: 'Pulido de resina',
          toothNumber: '16',
        },
      ],
      updatedAt: newUpdatedAt,
    });

    expect(attention.evolutionNotes).toBe('Evolución actualizada con pulido final');
    expect(attention.prescription).toBeNull();
    expect(attention.postOperativeIndications).toBe('Indicaciones actualizadas');
    expect(attention.privateNotes).toBe('Nueva nota privada');
    expect(attention.proceduresPerformed).toHaveLength(1);
    expect(attention.proceduresPerformed[0].code).toBe('PUL-01');
    expect(attention.updatedAt).toEqual(newUpdatedAt);
  });

  it('debe rechazar actualización con evolutionNotes vacío si se envía', () => {
    const attention = ClinicalAttention.create(validProps);
    const newUpdatedAt = new Date('2026-10-16T11:00:00.000Z');

    expect(() =>
      attention.update({
        evolutionNotes: '   ',
        updatedAt: newUpdatedAt,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe agregar un material usado a la atención y actualizar updatedAt', () => {
    const attention = ClinicalAttention.create(validProps);
    const material = AttentionMaterialUsed.create({
      id: 'mat-used-1',
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      materialId: 'mat-1',
      brand: '3M',
      reference: 'Filtek Z350 XT',
      type: 'Resina',
      color: 'A2',
      toothNumber: '16',
      quantity: 1,
      notes: 'Capa oclusal',
      createdAt: fixedCreatedAt,
    });

    const addTime = new Date('2026-10-16T10:30:00.000Z');
    attention.addMaterialUsed(material, addTime);

    expect(attention.materialsUsed).toHaveLength(1);
    expect(attention.materialsUsed[0].id).toBe('mat-used-1');
    expect(attention.updatedAt).toEqual(addTime);
  });

  it('debe rechazar modificaciones y adición de materiales cuando la atención está cerrada (CLOSED)', () => {
    const attention = ClinicalAttention.create({
      ...validProps,
      status: ClinicalAttentionStatus.CLOSED,
    });

    const actionTime = new Date('2026-10-16T12:00:00.000Z');

    expect(() =>
      attention.update({
        evolutionNotes: 'Intento de edición cerrada',
        updatedAt: actionTime,
      }),
    ).toThrow(ClinicalAttentionClosedError);

    const material = AttentionMaterialUsed.create({
      id: 'mat-used-1',
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      materialId: 'mat-1',
      brand: '3M',
      reference: 'Filtek',
      type: 'Resina',
      color: 'A2',
      quantity: 1,
      createdAt: fixedCreatedAt,
    });

    expect(() => attention.addMaterialUsed(material, actionTime)).toThrow(
      ClinicalAttentionClosedError,
    );
  });

  it('debe permitir cerrar la atención cambiando el estado a CLOSED y emitiendo AttentionClosedEvent', () => {
    const attention = ClinicalAttention.create(validProps);
    const closeTime = new Date('2026-10-16T13:00:00.000Z');

    attention.close(closeTime);

    expect(attention.status).toBe(ClinicalAttentionStatus.CLOSED);
    expect(attention.updatedAt).toEqual(closeTime);
    expect(attention.domainEvents).toHaveLength(1);
    const event = attention.domainEvents[0] as AttentionClosedEvent;
    expect(event.eventName).toBe('clinical.attention.closed');
    expect(event.aggregateId).toBe(attention.id);
    expect(event.occurredOn).toEqual(closeTime);
    expect(event.clinicId).toBe(attention.clinicId);
    expect(event.patientId).toBe(attention.patientId);
  });

  it('debe lanzar IncompleteClinicalAttentionError (422) cuando se intenta cerrar una atención sin procedimientos realizados', () => {
    const attentionWithoutProcedures = ClinicalAttention.create({
      ...validProps,
      proceduresPerformed: [],
    });

    const closeTime = new Date('2026-10-16T13:00:00.000Z');
    expect(() => attentionWithoutProcedures.close(closeTime)).toThrow(
      IncompleteClinicalAttentionError,
    );

    const attentionWithInvalidProcedure = ClinicalAttention.create({
      ...validProps,
      proceduresPerformed: [{ code: '   ' }],
    });
    expect(() => attentionWithInvalidProcedure.close(closeTime)).toThrow(
      IncompleteClinicalAttentionError,
    );
  });

  it('debe rechazar close() si la atención ya está CLOSED con ClinicalAttentionClosedError', () => {
    const attention = ClinicalAttention.create(validProps);
    const closeTime = new Date('2026-10-16T13:00:00.000Z');
    attention.close(closeTime);

    expect(() => attention.close(new Date('2026-10-16T13:30:00.000Z'))).toThrow(
      ClinicalAttentionClosedError,
    );
  });

  it('debe capturar toSnapshotData() como una instantánea inmutable y desacoplada del estado actual', () => {
    const attention = ClinicalAttention.create(validProps);
    const snapshot = attention.toSnapshotData();

    expect(snapshot.proceduresPerformed).toHaveLength(1);
    expect(snapshot.proceduresPerformed[0].code).toBe('RES-01');
    expect(snapshot.evolutionNotes).toBe(validProps.evolutionNotes);
    expect(snapshot.prescription).toBe(validProps.prescription);
    expect(snapshot.postOperativeIndications).toBe(validProps.postOperativeIndications);
    expect(snapshot.privateNotes).toBe(validProps.privateNotes);
    expect(snapshot.attendedAt).toBe(fixedAttendedAt.toISOString());
    expect(snapshot.updatedAt).toBe(fixedUpdatedAt.toISOString());
    expect(snapshot.materialsUsed).toEqual([]);

    snapshot.evolutionNotes = 'Modificado externamente';
    expect(attention.evolutionNotes).toBe(validProps.evolutionNotes);
  });

  it('debe lanzar InvalidClinicalAttentionDataError si changeReason está vacío o ClinicalAttentionNotClosedError si la atención sigue OPEN', () => {
    const openAttention = ClinicalAttention.create(validProps);
    const amendTime = new Date('2026-10-16T14:00:00.000Z');

    expect(() =>
      openAttention.amend({
        changeReason: 'Ajuste de notas',
        evolutionNotes: 'Nueva evolución',
        updatedAt: amendTime,
      }),
    ).toThrow(ClinicalAttentionNotClosedError);

    const closedAttention = ClinicalAttention.create(validProps);
    closedAttention.close(new Date('2026-10-16T13:00:00.000Z'));

    expect(() =>
      closedAttention.amend({
        changeReason: '',
        evolutionNotes: 'Nueva evolución',
        updatedAt: amendTime,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      closedAttention.amend({
        changeReason: '   ',
        evolutionNotes: 'Nueva evolución',
        updatedAt: amendTime,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe enmendar una atención cerrada actualizando los campos solicitados y renovando updatedAt', () => {
    const attention = ClinicalAttention.create(validProps);
    attention.close(new Date('2026-10-16T13:00:00.000Z'));

    const amendTime = new Date('2026-10-16T15:00:00.000Z');
    attention.amend({
      changeReason: 'Corrección de evolución y actualización de receta',
      evolutionNotes: 'Evolución rectificada con detalles adicionales',
      prescription: 'Ibuprofeno 600mg cada 8 horas',
      postOperativeIndications: 'Indicaciones revisadas',
      privateNotes: 'Nota privada complementada',
      proceduresPerformed: [
        {
          code: 'RES-02',
          name: 'Resina compuesta posterior',
          toothNumber: '16',
        },
      ],
      updatedAt: amendTime,
    });

    expect(attention.evolutionNotes).toBe('Evolución rectificada con detalles adicionales');
    expect(attention.prescription).toBe('Ibuprofeno 600mg cada 8 horas');
    expect(attention.postOperativeIndications).toBe('Indicaciones revisadas');
    expect(attention.privateNotes).toBe('Nota privada complementada');
    expect(attention.proceduresPerformed).toHaveLength(1);
    expect(attention.proceduresPerformed[0].code).toBe('RES-02');
    expect(attention.updatedAt).toEqual(amendTime);
    expect(attention.status).toBe(ClinicalAttentionStatus.CLOSED);
  });

  it('debe ocultar privateNotes en la entidad y en ClinicalAttentionResponseDto/ClinicalAttentionVersionResponseDto cuando viewerRole no es ADMIN', () => {
    const attention = ClinicalAttention.create(validProps);
    expect(attention.privateNotes).toBe('Paciente con ansiedad dental moderada');

    const adminView = attention.maskPrivateNotesForViewer('ADMIN');
    expect(adminView.privateNotes).toBe('Paciente con ansiedad dental moderada');

    const auxiliaryView = attention.maskPrivateNotesForViewer('AUXILIARY');
    expect(auxiliaryView.privateNotes).toBeNull();
    expect(auxiliaryView.id).toBe(attention.id);
    expect(auxiliaryView.evolutionNotes).toBe(attention.evolutionNotes);

    const otherRoleView = attention.maskPrivateNotesForViewer('OTHER');
    expect(otherRoleView.privateNotes).toBeNull();
  });

  it('debe rechazar procedimientos con código inexistente en el catálogo (404) o con diente FDI o superficie inválidos (400)', () => {
    // Diente FDI inválido (99)
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        proceduresPerformed: [
          {
            code: 'RES-01',
            toothNumber: '99',
            surface: 'OCCLUSAL',
          },
        ],
      }),
    ).toThrow(InvalidOdontogramDataError);

    // Superficie inválida
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        proceduresPerformed: [
          {
            code: 'RES-01',
            toothNumber: '16',
            surface: 'SUPERFICIE_FALSA',
          },
        ],
      }),
    ).toThrow(InvalidOdontogramDataError);

    // Superficie válida en español normalizada a ToothSurface.OCCLUSAL
    const attention = ClinicalAttention.create({
      ...validProps,
      proceduresPerformed: [
        {
          code: 'RES-01',
          toothNumber: '16',
          surface: 'Oclusal',
        },
      ],
    });
    expect(attention.proceduresPerformed[0].surface).toBe(ToothSurface.OCCLUSAL);
  });
});
