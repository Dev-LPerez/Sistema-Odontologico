import { ToothNumber } from './tooth-number.vo';
import { ToothSurface } from './tooth-surface.enum';
import { FindingCatalogCode } from './finding-catalog.enum';
import { FindingStatus } from './finding-status.enum';
import { InvalidOdontogramDataError } from './clinical.errors';

export interface ToothFindingProps {
  toothNumber: ToothNumber;
  surface: ToothSurface;
  findingCode: FindingCatalogCode;
  status: FindingStatus;
  notes?: string | null;
  createdAt?: Date;
}

export interface PlainToothFinding {
  toothNumber: number;
  surface: string;
  findingCode: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export class ToothFinding {
  private constructor(
    readonly toothNumber: ToothNumber,
    readonly surface: ToothSurface,
    readonly findingCode: FindingCatalogCode,
    readonly status: FindingStatus,
    readonly notes: string | null,
    readonly createdAt: Date,
  ) {}

  static create(props: ToothFindingProps): ToothFinding {
    if (!props.toothNumber || !(props.toothNumber instanceof ToothNumber)) {
      throw new InvalidOdontogramDataError('El número de diente FDI es obligatorio');
    }

    if (!Object.values(ToothSurface).includes(props.surface)) {
      throw new InvalidOdontogramDataError(`La superficie '${props.surface}' es inválida`);
    }

    if (!Object.values(FindingCatalogCode).includes(props.findingCode)) {
      throw new InvalidOdontogramDataError(
        `El código de hallazgo '${props.findingCode}' es desconocido`,
      );
    }

    if (!Object.values(FindingStatus).includes(props.status)) {
      throw new InvalidOdontogramDataError(`El estado '${props.status}' es inválido`);
    }

    const notes = props.notes && props.notes.trim() !== '' ? props.notes.trim() : null;
    const createdAt = props.createdAt ?? new Date();

    return new ToothFinding(
      props.toothNumber,
      props.surface,
      props.findingCode,
      props.status,
      notes,
      createdAt,
    );
  }

  toPlainObject(): PlainToothFinding {
    return {
      toothNumber: this.toothNumber.value,
      surface: this.surface,
      findingCode: this.findingCode,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
