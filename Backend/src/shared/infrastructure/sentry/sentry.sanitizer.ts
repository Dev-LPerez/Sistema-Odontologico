const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'cookie',
  'diagnosis',
  'notes',
  'privatenotes',
  'antecedents',
  'findings',
  'odontogram',
  'documentnumber',
  'phone',
  'firstname',
  'lastname',
  'email',
  'address',
  'birthdate',
  'emergencycontactname',
  'emergencycontactphone',
  'chiefcomplaint',
  'currentillness',
  'personalantecedents',
  'familyantecedents',
  'clinicalexamination',
  'diagnoses',
  'allergiesdetails',
  'medicationsdetails',
  'teethstate',
  'snapshotdata',
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof RegExp)) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (isSensitiveKey(k)) {
        sanitizedObj[k] = '[REDACTED]';
      } else {
        sanitizedObj[k] = sanitizeValue(v);
      }
    }
    return sanitizedObj;
  }

  return value;
}

export function sanitizeSentryEvent<T>(event: T): T {
  if (!event || typeof event !== 'object') {
    return event;
  }

  return sanitizeValue(event) as T;
}
