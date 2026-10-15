import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { Money } from './money.vo';
import { InvalidCatalogDataError } from './catalogs.errors';

export interface ProcedureProps {
  id: string;
  clinicId: string;
  code: string;
  name: string;
  description?: string | null;
  basePrice: Money;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProcedureProps {
  name?: string;
  description?: string | null;
  basePrice?: Money;
  isActive?: boolean;
  updatedAt: Date;
}

function validateRequiredText(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidCatalogDataError(`El campo ${fieldName} es obligatorio`);
  }
  return value.trim();
}

function validateBasePrice(price: unknown): Money {
  if (!price || !(price instanceof Money)) {
    throw new InvalidCatalogDataError(
      'El precio base del procedimiento es obligatorio y debe ser Money',
    );
  }
  return price;
}

export class Procedure extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly clinicId: string,
    private _code: string,
    private _name: string,
    private _description: string | null,
    private _basePrice: Money,
    private _isActive: boolean,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id);
  }

  static create(props: ProcedureProps): Procedure {
    const id = validateRequiredText(props.id, 'ID del procedimiento');
    const clinicId = validateRequiredText(props.clinicId, 'consultorio (clinicId)');
    const normalizedCode = Procedure.normalizeCode(props.code);
    const name = validateRequiredText(props.name, 'nombre del procedimiento');
    const basePrice = validateBasePrice(props.basePrice);

    const description =
      props.description !== undefined && props.description !== null
        ? props.description.trim()
        : null;
    const isActive = props.isActive !== undefined ? props.isActive : true;

    return new Procedure(
      id,
      clinicId,
      normalizedCode,
      name,
      description,
      basePrice,
      isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  static normalizeCode(code: string): string {
    return validateRequiredText(code, 'código del procedimiento').toUpperCase();
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get basePrice(): Money {
    return this._basePrice;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(props: UpdateProcedureProps): void {
    if (props.name !== undefined) {
      this._name = validateRequiredText(props.name, 'nombre');
    }

    if (props.description !== undefined) {
      this._description = props.description !== null ? props.description.trim() : null;
    }

    if (props.basePrice !== undefined) {
      this._basePrice = validateBasePrice(props.basePrice);
    }

    if (props.isActive !== undefined) {
      this._isActive = props.isActive;
    }

    this._updatedAt = props.updatedAt;
  }
}
