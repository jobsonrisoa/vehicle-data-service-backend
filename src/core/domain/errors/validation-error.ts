import { DomainError } from './domain-error';

export class ValidationError extends DomainError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
  }

  public toJSON(): {
    name: string;
    message: string;
    code: string;
    timestamp: string;
    stack?: string;
    field?: string;
  } {
    const base = super.toJSON();
    if (this.field) {
      return { ...base, field: this.field };
    }
    return base;
  }
}
