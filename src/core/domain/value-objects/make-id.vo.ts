import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { BaseValueObject } from '../../shared/base-value-object';
import { ValidationError } from '../errors/validation-error';

interface MakeIdProps {
  value: string;
}

export class MakeId extends BaseValueObject<MakeIdProps> {
  private constructor(props: MakeIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(): MakeId {
    return new MakeId({ value: uuidv4() });
  }

  static fromString(id: string): MakeId {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('MakeId must be a non-empty string');
    }

    if (!uuidValidate(id)) {
      throw new ValidationError(`Invalid UUID format for MakeId: ${id}`);
    }

    return new MakeId({ value: id });
  }

  equals(other: BaseValueObject<MakeIdProps>): boolean {
    if (!(other instanceof MakeId)) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
