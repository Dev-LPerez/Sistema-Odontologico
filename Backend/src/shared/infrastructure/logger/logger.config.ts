import { IncomingMessage, ServerResponse } from 'http';

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
  'diagnosis',
  'notes',
  'privateNotes',
  'antecedents',
  'findings',
  'odontogram',
  'documentNumber',
  'phone',
];

export const createPinoHttpConfig = () => {
  return {
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const headers = req.headers;
      const correlationId = headers['x-correlation-id'] || headers['x-request-id'];
      if (typeof correlationId === 'string') {
        res.setHeader('x-correlation-id', correlationId);
        return correlationId;
      }
      return (req as unknown as { id?: string }).id;
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
