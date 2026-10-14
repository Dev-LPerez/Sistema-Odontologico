import { CLINICAL_REDACT_PATHS } from './logger.config';
import pino from 'pino';

describe('Logger Clinical Redaction', () => {
  it('debe incluir los campos clínicos y credenciales en las rutas de redacción', () => {
    const requiredFields = [
      'password',
      'authorization',
      'diagnosis',
      'notes',
      'privateNotes',
      'antecedents',
      'findings',
      'odontogram',
      'documentNumber',
      'phone',
    ];

    for (const field of requiredFields) {
      const isRedacted = CLINICAL_REDACT_PATHS.some(
        (path) => path === field || path.endsWith(`.${field}`),
      );
      expect(isRedacted).toBe(true);
    }
  });

  it('debe censurar datos clínicos y credenciales al serializar logs con Pino', () => {
    let loggedData = '';
    const destination = {
      write: (msg: string) => {
        loggedData += msg;
      },
    };

    const logger = pino(
      {
        redact: {
          paths: CLINICAL_REDACT_PATHS,
          censor: '[REDACTED]',
        },
      },
      destination,
    );

    logger.info({
      user: 'dra-angelee',
      password: 'super-secret-password',
      patient: {
        documentNumber: '12345678',
        phone: '3001234567',
        diagnosis: 'Caries oclusal profunda en diente 16',
        notes: 'Paciente con antecedentes de hipertensión',
        privateNotes: 'Nota privada confidencial',
        antecedents: 'Alérgica a la penicilina',
        findings: 'Gingivitis marginal',
        odontogram: { tooth16: 'decayed' },
      },
    });

    const parsed = JSON.parse(loggedData);

    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.patient.documentNumber).toBe('[REDACTED]');
    expect(parsed.patient.phone).toBe('[REDACTED]');
    expect(parsed.patient.diagnosis).toBe('[REDACTED]');
    expect(parsed.patient.notes).toBe('[REDACTED]');
    expect(parsed.patient.privateNotes).toBe('[REDACTED]');
    expect(parsed.patient.antecedents).toBe('[REDACTED]');
    expect(parsed.patient.findings).toBe('[REDACTED]');
    expect(parsed.patient.odontogram).toBe('[REDACTED]');
  });
});
