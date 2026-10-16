import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { InsufficientMaterialStockError, InvalidCatalogDataError } from './catalogs.errors';

export interface MaterialProps {
  id: string;
  clinicId: string;
  brand: string;
  reference: string;
  type: string;
  color: string;
  currentStock: number;
  minStock: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateMaterialProps {
  brand?: string;
  reference?: string;
  type?: string;
  color?: string;
  currentStock?: number;
  minStock?: number;
  isActive?: boolean;
  updatedAt: Date;
}

function validateRequiredText(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidCatalogDataError(`El campo ${fieldName} es obligatorio`);
  }
  return value.trim();
}

function validateStockAmount(value: unknown, fieldName: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new InvalidCatalogDataError(
      `El campo ${fieldName} debe ser un número entero mayor o igual a cero`,
    );
  }
  return value;
}

export class Material extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly clinicId: string,
    private _brand: string,
    private _reference: string,
    private _type: string,
    private _color: string,
    private _currentStock: number,
    private _minStock: number,
    private _isActive: boolean,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id);
  }

  static create(props: MaterialProps): Material {
    const id = validateRequiredText(props.id, 'ID del material');
    const clinicId = validateRequiredText(props.clinicId, 'consultorio (clinicId)');
    const brand = validateRequiredText(props.brand, 'marca del material');
    const reference = validateRequiredText(props.reference, 'referencia del material');
    const type = validateRequiredText(props.type, 'tipo de material');
    const color = validateRequiredText(props.color, 'color del material');
    const currentStock = validateStockAmount(
      props.currentStock,
      'existencia actual (currentStock)',
    );
    const minStock = validateStockAmount(props.minStock, 'stock mínimo (minStock)');
    const isActive = props.isActive !== undefined ? props.isActive : true;

    return new Material(
      id,
      clinicId,
      brand,
      reference,
      type,
      color,
      currentStock,
      minStock,
      isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  get brand(): string {
    return this._brand;
  }

  get reference(): string {
    return this._reference;
  }

  get type(): string {
    return this._type;
  }

  get color(): string {
    return this._color;
  }

  get currentStock(): number {
    return this._currentStock;
  }

  get minStock(): number {
    return this._minStock;
  }

  get isLowStock(): boolean {
    return this._currentStock <= this._minStock;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static validateConsumeQuantity(quantity: number): void {
    if (
      typeof quantity !== 'number' ||
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new InvalidCatalogDataError(
        'La cantidad a descontar debe ser un número entero mayor a cero',
      );
    }
  }

  consumeStock(quantity: number, now: Date): void {
    Material.validateConsumeQuantity(quantity);

    if (!this._isActive) {
      throw new InvalidCatalogDataError(
        'No se puede descontar existencias de un material inactivo',
      );
    }

    if (quantity > this._currentStock) {
      throw new InsufficientMaterialStockError(this._currentStock, quantity);
    }

    this._currentStock -= quantity;
    this._updatedAt = now;
  }

  private updateAttributes(props: UpdateMaterialProps): void {
    if (props.brand !== undefined) {
      this._brand = validateRequiredText(props.brand, 'marca');
    }
    if (props.reference !== undefined) {
      this._reference = validateRequiredText(props.reference, 'referencia');
    }
    if (props.type !== undefined) {
      this._type = validateRequiredText(props.type, 'tipo');
    }
    if (props.color !== undefined) {
      this._color = validateRequiredText(props.color, 'color');
    }
  }

  private updateStock(props: UpdateMaterialProps): void {
    if (props.currentStock !== undefined) {
      this._currentStock = validateStockAmount(
        props.currentStock,
        'existencia actual (currentStock)',
      );
    }
    if (props.minStock !== undefined) {
      this._minStock = validateStockAmount(props.minStock, 'stock mínimo (minStock)');
    }
    if (props.isActive !== undefined) {
      this._isActive = props.isActive;
    }
  }

  update(props: UpdateMaterialProps): void {
    this.updateAttributes(props);
    this.updateStock(props);
    this._updatedAt = props.updatedAt;
  }
}
