import { InvalidClinicalAttentionDataError } from './clinical.errors';
import { ToothNumber } from './tooth-number.vo';

export interface AttentionMaterialUsedProps {
  id: string;
  clinicId: string;
  attentionId: string;
  materialId: string;
  brand: string;
  reference: string;
  type: string;
  color: string;
  toothNumber?: string | null;
  quantity: number;
  notes?: string | null;
  createdAt: Date;
}

export class AttentionMaterialUsed {
  private constructor(private readonly props: AttentionMaterialUsedProps) {}

  public static create(props: AttentionMaterialUsedProps): AttentionMaterialUsed {
    AttentionMaterialUsed.validateRequiredStrings(props);
    AttentionMaterialUsed.validateQuantity(props.quantity);
    AttentionMaterialUsed.validateDate(props.createdAt);

    let normalizedTooth: string | null = null;
    if (props.toothNumber && props.toothNumber.trim().length > 0) {
      const toothVo = ToothNumber.of(props.toothNumber.trim());
      normalizedTooth = toothVo.code;
    }

    return new AttentionMaterialUsed({
      ...props,
      toothNumber: normalizedTooth,
      notes: props.notes ? props.notes.trim() : null,
    });
  }

  private static validateRequiredStrings(props: AttentionMaterialUsedProps): void {
    const required: Array<[string, string]> = [
      ['ID', props.id],
      ['Clinic ID', props.clinicId],
      ['Attention ID', props.attentionId],
      ['Material ID', props.materialId],
      ['Marca', props.brand],
      ['Referencia', props.reference],
      ['Tipo', props.type],
      ['Color', props.color],
    ];

    for (const [name, value] of required) {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new InvalidClinicalAttentionDataError(
          `El campo '${name}' del material usado es obligatorio`,
        );
      }
    }
  }

  private static validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidClinicalAttentionDataError(
        'La cantidad del material usado debe ser un número entero mayor a cero',
      );
    }
  }

  private static validateDate(date: Date): void {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new InvalidClinicalAttentionDataError(
        'La fecha de creación del material usado es inválida',
      );
    }
  }

  get id(): string {
    return this.props.id;
  }

  get clinicId(): string {
    return this.props.clinicId;
  }

  get attentionId(): string {
    return this.props.attentionId;
  }

  get materialId(): string {
    return this.props.materialId;
  }

  get brand(): string {
    return this.props.brand;
  }

  get reference(): string {
    return this.props.reference;
  }

  get type(): string {
    return this.props.type;
  }

  get color(): string {
    return this.props.color;
  }

  get toothNumber(): string | null {
    return this.props.toothNumber ?? null;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get notes(): string | null {
    return this.props.notes ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
