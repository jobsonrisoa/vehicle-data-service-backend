export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  protected constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): {
    name: string;
    message: string;
    code: string;
    timestamp: string;
    stack?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}
