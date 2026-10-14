import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { DocumentIdentity } from './document-identity.vo';
import { PhoneNumber } from './phone-number.vo';
import { EmergencyContact } from './emergency-contact.vo';
import { AcquisitionSource } from './acquisition-source.enum';
import { DataTreatmentConsentRequiredError, InvalidPatientDataError } from './patients.errors';

export interface PatientProps {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  document: DocumentIdentity;
  birthDate: Date;
  phone: PhoneNumber;
  email?: string | null;
  address?: string | null;
  emergencyContact?: EmergencyContact | null;
  acquisitionSource: AcquisitionSource;
  dataTreatmentConsent: boolean;
  dataTreatmentConsentAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePatientDemographicsProps {
  firstName?: string;
  lastName?: string;
  phone?: PhoneNumber;
  email?: string | null;
  address?: string | null;
  emergencyContact?: EmergencyContact | null;
  acquisitionSource?: AcquisitionSource;
  updatedAt: Date;
}

export class Patient extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly clinicId: string,
    private _firstName: string,
    private _lastName: string,
    private _document: DocumentIdentity,
    private _birthDate: Date,
    private _phone: PhoneNumber,
    private _email: string | null,
    private _address: string | null,
    private _emergencyContact: EmergencyContact | null,
    private _acquisitionSource: AcquisitionSource,
    readonly dataTreatmentConsent: boolean,
    readonly dataTreatmentConsentAt: Date,
    private _isActive: boolean,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id);
  }

  static create(props: PatientProps): Patient {
    if (!props.dataTreatmentConsent) {
      throw new DataTreatmentConsentRequiredError();
    }

    if (!props.firstName || props.firstName.trim().length === 0) {
      throw new InvalidPatientDataError('El nombre del paciente es obligatorio');
    }

    if (!props.lastName || props.lastName.trim().length === 0) {
      throw new InvalidPatientDataError('El apellido del paciente es obligatorio');
    }

    return new Patient(
      props.id,
      props.clinicId,
      props.firstName.trim(),
      props.lastName.trim(),
      props.document,
      props.birthDate,
      props.phone,
      props.email ? props.email.trim().toLowerCase() : null,
      props.address ? props.address.trim() : null,
      props.emergencyContact ?? null,
      props.acquisitionSource,
      props.dataTreatmentConsent,
      props.dataTreatmentConsentAt,
      props.isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get document(): DocumentIdentity {
    return this._document;
  }

  get birthDate(): Date {
    return this._birthDate;
  }

  get phone(): PhoneNumber {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get address(): string | null {
    return this._address;
  }

  get emergencyContact(): EmergencyContact | null {
    return this._emergencyContact;
  }

  get acquisitionSource(): AcquisitionSource {
    return this._acquisitionSource;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  changeStatus(isActive: boolean, updatedAt: Date): void {
    this._isActive = isActive;
    this._updatedAt = updatedAt;
  }

  private updateNames(firstName?: string, lastName?: string): void {
    if (firstName !== undefined) {
      if (firstName.trim().length === 0) {
        throw new InvalidPatientDataError('El nombre del paciente no puede estar vacío');
      }
      this._firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (lastName.trim().length === 0) {
        throw new InvalidPatientDataError('El apellido del paciente no puede estar vacío');
      }
      this._lastName = lastName.trim();
    }
  }

  updateDemographics(props: UpdatePatientDemographicsProps): void {
    this.updateNames(props.firstName, props.lastName);

    if (props.phone !== undefined) {
      this._phone = props.phone;
    }
    if (props.email !== undefined) {
      this._email = props.email ? props.email.trim().toLowerCase() : null;
    }
    if (props.address !== undefined) {
      this._address = props.address ? props.address.trim() : null;
    }
    if (props.emergencyContact !== undefined) {
      this._emergencyContact = props.emergencyContact;
    }
    if (props.acquisitionSource !== undefined) {
      this._acquisitionSource = props.acquisitionSource;
    }

    this._updatedAt = props.updatedAt;
  }
}
