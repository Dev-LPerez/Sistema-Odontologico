import { sanitizeSentryEvent } from './sentry.sanitizer';

describe('sanitizeSentryEvent', () => {
  it('debe censurar recursivamente credenciales y datos clínicos en extra, breadcrumbs y request', () => {
    const rawEvent = {
      message: 'Error procesando historia clínica',
      request: {
        data: {
          email: 'paciente@example.com',
          password: 'password123',
          documentNumber: '987654321',
          phone: '3109876543',
          diagnosis: 'Pulpitis irreversible',
          odontogram: {
            teeth: [18, 17, 16],
          },
        },
        headers: {
          authorization: 'Bearer jwt-token-xyz',
          cookie: 'session=abc',
        },
      },
      extra: {
        patientDetails: {
          notes: 'Observaciones confidenciales del tratamiento',
          privateNotes: 'Anotación privada de la doctora',
          antecedents: 'Diabetes tipo 2',
          findings: 'Movilidad grado 1',
        },
      },
      breadcrumbs: [
        {
          category: 'xhr',
          data: {
            password: 'secret',
            diagnosis: 'Caries',
          },
        },
      ],
    };

    const sanitized = sanitizeSentryEvent(rawEvent);

    expect(sanitized.request.data.password).toBe('[REDACTED]');
    expect(sanitized.request.data.documentNumber).toBe('[REDACTED]');
    expect(sanitized.request.data.phone).toBe('[REDACTED]');
    expect(sanitized.request.data.diagnosis).toBe('[REDACTED]');
    expect(sanitized.request.data.odontogram).toBe('[REDACTED]');
    expect(sanitized.request.headers.authorization).toBe('[REDACTED]');
    expect(sanitized.request.headers.cookie).toBe('[REDACTED]');

    expect(sanitized.extra.patientDetails.notes).toBe('[REDACTED]');
    expect(sanitized.extra.patientDetails.privateNotes).toBe('[REDACTED]');
    expect(sanitized.extra.patientDetails.antecedents).toBe('[REDACTED]');
    expect(sanitized.extra.patientDetails.findings).toBe('[REDACTED]');

    expect(sanitized.breadcrumbs[0].data.password).toBe('[REDACTED]');
    expect(sanitized.breadcrumbs[0].data.diagnosis).toBe('[REDACTED]');

    // Campos no sensibles deben mantenerse intactos
    expect(sanitized.message).toBe('Error procesando historia clínica');
    expect(sanitized.request.data.email).toBe('[REDACTED]');
  });

  it('debe redactar todos los datos personales del paciente: firstName, lastName, email, address, birthDate, emergencyContactName y emergencyContactPhone (RC-023)', () => {
    const event = {
      extra: {
        patient: {
          firstName: 'Carlos',
          lastName: 'Gómez',
          email: 'carlos@example.com',
          address: 'Calle 100',
          birthDate: '1990-05-15',
          emergencyContactName: 'María Gómez',
          emergencyContactPhone: '3109876543',
          nonSensitiveField: 'visible-value',
        },
      },
    };

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.extra.patient.firstName).toBe('[REDACTED]');
    expect(sanitized.extra.patient.lastName).toBe('[REDACTED]');
    expect(sanitized.extra.patient.email).toBe('[REDACTED]');
    expect(sanitized.extra.patient.address).toBe('[REDACTED]');
    expect(sanitized.extra.patient.birthDate).toBe('[REDACTED]');
    expect(sanitized.extra.patient.emergencyContactName).toBe('[REDACTED]');
    expect(sanitized.extra.patient.emergencyContactPhone).toBe('[REDACTED]');
    expect(sanitized.extra.patient.nonSensitiveField).toBe('visible-value');
  });

  it('debe redactar todos los campos de historia clínica en Sentry: chiefComplaint, currentIllness, personalAntecedents, familyAntecedents, clinicalExamination, diagnoses, allergiesDetails y medicationsDetails (RNF-B-009, RC-023)', () => {
    const event = {
      extra: {
        clinicalHistory: {
          chiefComplaint: 'Dolor agudo en molar inferior',
          currentIllness: 'Evolución de 3 días con inflamación',
          personalAntecedents: { allergies: true },
          familyAntecedents: 'Madre hipertensa',
          clinicalExamination: 'Caries cavitada en 46',
          diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
          allergiesDetails: 'Alergia a la penicilina',
          medicationsDetails: 'Amoxicilina 500mg',
          historyId: 'hist-123',
        },
      },
    };

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.extra.clinicalHistory.chiefComplaint).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.currentIllness).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.personalAntecedents).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.familyAntecedents).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.clinicalExamination).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.diagnoses).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.allergiesDetails).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.medicationsDetails).toBe('[REDACTED]');
    expect(sanitized.extra.clinicalHistory.historyId).toBe('hist-123');
  });

  it('debe redactar los campos de odontograma en Sentry: teethState y snapshotData (RNF-B-009, RC-023)', () => {
    const event = {
      extra: {
        odontogramDetails: {
          teethState: { '16': { findings: ['AMALGAM'] } },
          snapshotData: { reason: 'EVOLUTION' },
          odontogramId: 'odon-123',
        },
      },
    };

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.extra.odontogramDetails.teethState).toBe('[REDACTED]');
    expect(sanitized.extra.odontogramDetails.snapshotData).toBe('[REDACTED]');
    expect(sanitized.extra.odontogramDetails.odontogramId).toBe('odon-123');
  });

  it('debe redactar todos los campos de atención clínica en Sentry: evolutionNotes, prescription, postOperativeIndications y proceduresPerformed (RNF-B-009, RC-023)', () => {
    const event = {
      extra: {
        attention: {
          evolutionNotes: 'Diente 16 restaurado exitosamente',
          prescription: 'Ibuprofeno 400mg cada 8h',
          postOperativeIndications: 'No masticar alimentos duros por 24h',
          proceduresPerformed: [{ code: 'RES-01' }],
          attentionId: 'att-123',
        },
      },
    };

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.extra.attention.evolutionNotes).toBe('[REDACTED]');
    expect(sanitized.extra.attention.prescription).toBe('[REDACTED]');
    expect(sanitized.extra.attention.postOperativeIndications).toBe('[REDACTED]');
    expect(sanitized.extra.attention.proceduresPerformed).toBe('[REDACTED]');
    expect(sanitized.extra.attention.attentionId).toBe('att-123');
  });

  it('debe redactar los campos de versionado y enmienda en Sentry: previousData y changeReason (RNF-B-009, RC-023)', () => {
    const event = {
      extra: {
        version: {
          previousData: { evolutionNotes: 'Evolución previa' },
          changeReason: 'Corrección de evolución',
          versionId: 'ver-123',
        },
      },
    };

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.extra.version.previousData).toBe('[REDACTED]');
    expect(sanitized.extra.version.changeReason).toBe('[REDACTED]');
    expect(sanitized.extra.version.versionId).toBe('ver-123');
  });

  it('debe manejar eventos nulos o sin campos adicionales sin fallar', () => {
    expect(sanitizeSentryEvent(null as unknown as Record<string, unknown>)).toBeNull();
    const minimalEvent = { message: 'Simple error' };
    expect(sanitizeSentryEvent(minimalEvent)).toEqual(minimalEvent);
  });

  it('debe manejar campos con valores null o undefined dentro de objetos', () => {
    const eventWithNulls = {
      user: null,
      details: {
        info: undefined,
        active: true,
        count: 42,
      },
    };
    expect(sanitizeSentryEvent(eventWithNulls)).toEqual(eventWithNulls);
  });
});
