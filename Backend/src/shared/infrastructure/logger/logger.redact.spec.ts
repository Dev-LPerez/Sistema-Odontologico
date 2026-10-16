import { IncomingMessage, ServerResponse } from 'http';
import { CLINICAL_REDACT_PATHS, createPinoHttpConfig } from './logger.config';
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

  it('debe redactar todos los datos personales del paciente: firstName, lastName, email, address, birthDate, emergencyContactName y emergencyContactPhone (RC-023)', () => {
    const piiFields = [
      'firstName',
      'lastName',
      'email',
      'address',
      'birthDate',
      'emergencyContactName',
      'emergencyContactPhone',
    ];

    for (const field of piiFields) {
      const isRedacted = CLINICAL_REDACT_PATHS.some(
        (path) => path === field || path.endsWith(`.${field}`),
      );
      expect(isRedacted).toBe(true);
    }
  });

  it('debe redactar todos los campos de historia clínica: chiefComplaint, currentIllness, personalAntecedents, familyAntecedents, clinicalExamination, diagnoses, allergiesDetails y medicationsDetails (RNF-B-009, RC-023)', () => {
    const clinicalFields = [
      'chiefComplaint',
      'currentIllness',
      'personalAntecedents',
      'familyAntecedents',
      'clinicalExamination',
      'diagnoses',
      'allergiesDetails',
      'medicationsDetails',
    ];

    for (const field of clinicalFields) {
      const isRedacted = CLINICAL_REDACT_PATHS.some(
        (path) => path === field || path.endsWith(`.${field}`),
      );
      expect(isRedacted).toBe(true);
    }
  });

  it('debe redactar los campos de odontograma: teethState y snapshotData (RNF-B-009, RC-023)', () => {
    const odontogramFields = ['teethState', 'snapshotData'];

    for (const field of odontogramFields) {
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
        teethState: { '16': { findings: ['CARIES'] } },
        snapshotData: { reason: 'INITIAL' },
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
    expect(parsed.patient.teethState).toBe('[REDACTED]');
    expect(parsed.patient.snapshotData).toBe('[REDACTED]');
  });

  describe('createPinoHttpConfig', () => {
    it('debe usar x-correlation-id existente en genReqId', () => {
      const config = createPinoHttpConfig();
      const mockReq = { headers: { 'x-correlation-id': 'existing-corr-123' } };
      const mockRes = { setHeader: jest.fn() };

      const id = config.genReqId(
        mockReq as unknown as IncomingMessage,
        mockRes as unknown as ServerResponse,
      );

      expect(id).toBe('existing-corr-123');
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', 'existing-corr-123');
    });

    it('debe usar x-request-id si x-correlation-id no está presente', () => {
      const config = createPinoHttpConfig();
      const mockReq = { headers: { 'x-request-id': 'req-id-456' } };
      const mockRes = { setHeader: jest.fn() };

      const id = config.genReqId(
        mockReq as unknown as IncomingMessage,
        mockRes as unknown as ServerResponse,
      );

      expect(id).toBe('req-id-456');
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', 'req-id-456');
    });

    it('debe generar un UUID nuevo si no hay cabeceras previas', () => {
      const config = createPinoHttpConfig();
      const mockReq = { headers: {} };
      const mockRes = { setHeader: jest.fn() };

      const id = config.genReqId(
        mockReq as unknown as IncomingMessage,
        mockRes as unknown as ServerResponse,
      );

      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', id);
    });

    it('debe configurar transport pino-pretty fuera de production', () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const devConfig = createPinoHttpConfig();
      expect(devConfig.transport).toBeDefined();

      process.env.NODE_ENV = 'production';
      const prodConfig = createPinoHttpConfig();
      expect(prodConfig.transport).toBeUndefined();

      process.env.NODE_ENV = prevEnv;
    });
  });
});
