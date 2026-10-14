import { AggregateRoot } from '../../../shared/domain/aggregate-root';

export interface ClinicProps {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClinicDetailsProps {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  settings?: Record<string, unknown> | null;
  updatedAt: Date;
}

export class Clinic extends AggregateRoot<string> {
  private constructor(
    id: string,
    private _name: string,
    private _address: string | null,
    private _phone: string | null,
    private _email: string | null,
    private _logoUrl: string | null,
    private _settings: Record<string, unknown> | null,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id);
  }

  static create(props: ClinicProps): Clinic {
    return new Clinic(
      props.id,
      props.name,
      props.address ?? null,
      props.phone ?? null,
      props.email ?? null,
      props.logoUrl ?? null,
      props.settings ?? null,
      props.createdAt,
      props.updatedAt,
    );
  }

  get name(): string {
    return this._name;
  }

  get address(): string | null {
    return this._address;
  }

  get phone(): string | null {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get logoUrl(): string | null {
    return this._logoUrl;
  }

  get settings(): Record<string, unknown> | null {
    return this._settings;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateDetails(props: UpdateClinicDetailsProps): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.address !== undefined) this._address = props.address;
    if (props.phone !== undefined) this._phone = props.phone;
    if (props.email !== undefined) this._email = props.email;
    if (props.logoUrl !== undefined) this._logoUrl = props.logoUrl;
    if (props.settings !== undefined) this._settings = props.settings;
    this._updatedAt = props.updatedAt;
  }
}
