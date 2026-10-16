import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { ToothFinding, PlainToothFinding } from './tooth-finding.vo';
import { InvalidOdontogramDataError } from './clinical.errors';

export interface OdontogramProps {
  id: string;
  clinicId: string;
  patientId: string;
  hasTemporalDentition: boolean;
  findings?: ToothFinding[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StructuredOdontogramJson {
  hasTemporalDentition: boolean;
  teeth: Record<string, PlainToothFinding[]>;
}

function validateNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidOdontogramDataError(`El campo '${fieldName}' es obligatorio`);
  }
  return value.trim();
}

export class Odontogram extends AggregateRoot<string> {
  private _hasTemporalDentition: boolean;
  private readonly _findings: ToothFinding[];
  private _updatedAt: Date;

  private constructor(
    id: string,
    readonly clinicId: string,
    readonly patientId: string,
    hasTemporalDentition: boolean,
    findings: ToothFinding[],
    readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._hasTemporalDentition = hasTemporalDentition;
    this._findings = [...findings];
    this._updatedAt = updatedAt;
  }

  static create(props: OdontogramProps): Odontogram {
    const id = validateNonEmptyString(props.id, 'id');
    const clinicId = validateNonEmptyString(props.clinicId, 'clinicId');
    const patientId = validateNonEmptyString(props.patientId, 'patientId');
    const hasTemporalDentition = Boolean(props.hasTemporalDentition);
    const findings = props.findings ? [...props.findings] : [];

    if (!hasTemporalDentition) {
      const hasTemporalFindings = findings.some((f) => f.toothNumber.isTemporal);
      if (hasTemporalFindings) {
        throw new InvalidOdontogramDataError(
          'No se pueden registrar hallazgos en dentición temporal si hasTemporalDentition es falso',
        );
      }
    }

    return new Odontogram(
      id,
      clinicId,
      patientId,
      hasTemporalDentition,
      findings,
      props.createdAt,
      props.updatedAt,
    );
  }

  get hasTemporalDentition(): boolean {
    return this._hasTemporalDentition;
  }

  get findings(): ReadonlyArray<ToothFinding> {
    return this._findings;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateFindings(
    newFindings: ToothFinding[],
    hasTemporalDentition: boolean | undefined,
    updatedAt: Date,
  ): void {
    const nextHasTemporal =
      hasTemporalDentition !== undefined ? hasTemporalDentition : this._hasTemporalDentition;

    if (!nextHasTemporal) {
      const hasTemporalFindings = newFindings.some((f) => f.toothNumber.isTemporal);
      if (hasTemporalFindings) {
        throw new InvalidOdontogramDataError(
          'No se pueden registrar hallazgos en dentición temporal si hasTemporalDentition es falso',
        );
      }
    }

    if (!updatedAt || !(updatedAt instanceof Date) || isNaN(updatedAt.getTime())) {
      throw new InvalidOdontogramDataError('La fecha de actualización es obligatoria');
    }

    this._hasTemporalDentition = nextHasTemporal;
    this._findings.length = 0;
    this._findings.push(...newFindings);
    this._updatedAt = updatedAt;
  }

  toStructuredJson(): StructuredOdontogramJson {
    const teeth: Record<string, PlainToothFinding[]> = {};

    for (const finding of this._findings) {
      const code = finding.toothNumber.code;
      if (!teeth[code]) {
        teeth[code] = [];
      }
      teeth[code].push(finding.toPlainObject());
    }

    return {
      hasTemporalDentition: this._hasTemporalDentition,
      teeth,
    };
  }
}
