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
    expect(sanitized.request.data.email).toBe('paciente@example.com');
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
