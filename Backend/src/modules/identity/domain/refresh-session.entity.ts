import { AggregateRoot } from '../../../shared/domain/aggregate-root';

export interface RefreshSessionProps {
  id: string;
  clinicId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

export class RefreshSession extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly clinicId: string,
    readonly userId: string,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    private _revokedAt: Date | null,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  static create(props: RefreshSessionProps): RefreshSession {
    return new RefreshSession(
      props.id,
      props.clinicId,
      props.userId,
      props.tokenHash,
      props.expiresAt,
      props.revokedAt ?? null,
      props.createdAt,
    );
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  isRevoked(): boolean {
    return this._revokedAt !== null && this._revokedAt !== undefined;
  }

  isExpired(now: Date): boolean {
    return now.getTime() >= this.expiresAt.getTime();
  }

  isValid(now: Date): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }

  revoke(revokedAt: Date): void {
    this._revokedAt = revokedAt;
  }
}
