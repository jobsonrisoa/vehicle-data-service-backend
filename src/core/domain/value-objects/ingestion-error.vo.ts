import { BaseValueObject } from '../../shared/base-value-object';

interface IngestionErrorProps {
  makeId: number;
  errorMessage: string;
  occurredAt: Date;
}

export class IngestionError extends BaseValueObject<IngestionErrorProps> {
  private constructor(props: IngestionErrorProps) {
    super(props);
  }

  get makeId(): number {
    return this.props.makeId;
  }

  get errorMessage(): string {
    return this.props.errorMessage;
  }

  get occurredAt(): Date {
    return new Date(this.props.occurredAt);
  }

  public static create(makeId: number, errorMessage: string): IngestionError {
    return new IngestionError({
      makeId,
      errorMessage,
      occurredAt: new Date(),
    });
  }

  public equals(other: IngestionError): boolean {
    if (!(other instanceof IngestionError)) {
      return false;
    }
    return (
      this.makeId === other.makeId &&
      this.errorMessage === other.errorMessage &&
      this.occurredAt.getTime() === other.occurredAt.getTime()
    );
  }

  public toJSON(): { makeId: number; errorMessage: string; occurredAt: string } {
    return {
      makeId: this.props.makeId,
      errorMessage: this.props.errorMessage,
      occurredAt: this.props.occurredAt.toISOString(),
    };
  }
}
