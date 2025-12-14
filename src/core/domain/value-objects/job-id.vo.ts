import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { BaseValueObject } from '../../shared/base-value-object';
import { ValidationError } from '../errors/validation-error';

interface JobIdProps {
  value: string;
}

export class JobId extends BaseValueObject<JobIdProps> {
  private constructor(props: JobIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(): JobId {
    return new JobId({ value: uuidv4() });
  }

  static fromString(id: string): JobId {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('JobId must be a non-empty string');
    }

    if (!uuidValidate(id)) {
      throw new ValidationError(`Invalid UUID format for JobId: ${id}`);
    }

    return new JobId({ value: id });
  }

  equals(other: BaseValueObject<JobIdProps>): boolean {
    if (!(other instanceof JobId)) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
