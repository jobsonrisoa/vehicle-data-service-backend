import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { BaseValueObject } from '../../shared/base-value-object';
import { ValidationError } from '../errors/validation-error';

interface TypeIdProps {
  value: string;
}

export class TypeId extends BaseValueObject<TypeIdProps> {
  private constructor(props: TypeIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(): TypeId {
    return new TypeId({ value: uuidv4() });
  }

  static fromString(id: string): TypeId {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('TypeId must be a non-empty string');
    }

    if (!uuidValidate(id)) {
      throw new ValidationError(`Invalid UUID format for TypeId: ${id}`);
    }

    return new TypeId({ value: id });
  }

  equals(other: BaseValueObject<TypeIdProps>): boolean {
    if (!(other instanceof TypeId)) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
