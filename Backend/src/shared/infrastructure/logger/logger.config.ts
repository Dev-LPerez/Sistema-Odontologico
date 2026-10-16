import { IncomingMessage, ServerResponse } from 'http';
import * as crypto from 'crypto';

export const CLINICAL_REDACT_PATHS = [
  'password',
  'token',
  'authorization',
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.token',
  '*.authorization',
  '*.diagnosis',
  '*.notes',
  '*.privateNotes',
  '*.antecedents',
  '*.findings',
  '*.odontogram',
  '*.documentNumber',
  '*.phone',
  '*.firstName',
  '*.lastName',
  '*.email',
  '*.address',
  '*.birthDate',
  '*.emergencyContactName',
  '*.emergencyContactPhone',
  '*.chiefComplaint',
  '*.currentIllness',
  '*.personalAntecedents',
  '*.familyAntecedents',
  '*.clinicalExamination',
  '*.diagnoses',
  '*.allergiesDetails',
  '*.medicationsDetails',
  '*.teethState',
  '*.snapshotData',
  '*.evolutionNotes',
  '*.prescription',
  '*.postOperativeIndications',
  '*.proceduresPerformed',
  'diagnosis',
  'notes',
  'privateNotes',
  'antecedents',
  'findings',
  'odontogram',
  'documentNumber',
  'phone',
  'firstName',
  'lastName',
  'email',
  'address',
  'birthDate',
  'emergencyContactName',
  'emergencyContactPhone',
  'chiefComplaint',
  'currentIllness',
  'personalAntecedents',
  'familyAntecedents',
  'clinicalExamination',
  'diagnoses',
  'allergiesDetails',
  'medicationsDetails',
  'teethState',
  'snapshotData',
  'evolutionNotes',
  'prescription',
  'postOperativeIndications',
  'proceduresPerformed',
];

export const createPinoHttpConfig = () => {
  return {
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const headers = req.headers;
      const correlationId = headers['x-correlation-id'] || headers['x-request-id'];
      if (typeof correlationId === 'string' && correlationId.trim().length > 0) {
        res.setHeader('x-correlation-id', correlationId);
        return correlationId;
      }
      const newId = crypto.randomUUID();
      headers['x-correlation-id'] = newId;
      res.setHeader('x-correlation-id', newId);
      return newId;
    },
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
            },
          }
        : undefined,
    autoLogging: true,
    redact: {
      paths: CLINICAL_REDACT_PATHS,
      censor: '[REDACTED]',
    },
  };
};
