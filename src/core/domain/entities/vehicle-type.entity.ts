import { Entity } from '../../shared/base-entity';
import { TypeId } from '../value-objects/type-id.vo';
import { ValidationError } from '../errors/validation-error';

interface VehicleTypeProps {
  typeId: number;
  typeName: string;
}

interface VehicleTypeSnapshot extends VehicleTypeProps {
  id: TypeId;
}

export class VehicleType extends Entity<TypeId> {
  private readonly _typeId: number;
  private readonly _typeName: string;

  private constructor(id: TypeId, props: VehicleTypeProps) {
    super(id);
    this._typeId = props.typeId;
    this._typeName = props.typeName;
  }

  get typeId(): number {
    return this._typeId;
  }

  get typeName(): string {
    return this._typeName;
  }

  static create(props: VehicleTypeProps): VehicleType {
    VehicleType.validate(props);
    const id = TypeId.create();
    const trimmedTypeName = props.typeName.trim();
    return new VehicleType(id, { typeId: props.typeId, typeName: trimmedTypeName });
  }

  static reconstitute(snapshot: VehicleTypeSnapshot): VehicleType {
    VehicleType.validate({ typeId: snapshot.typeId, typeName: snapshot.typeName });
    return new VehicleType(snapshot.id, {
      typeId: snapshot.typeId,
      typeName: snapshot.typeName.trim(),
    });
  }

  equals(other: VehicleType): boolean {
    if (!(other instanceof VehicleType)) {
      return false;
    }
    return this.typeId === other.typeId;
  }

  toJSON(): { id: string; typeId: number; typeName: string } {
    return {
      id: this.id.value,
      typeId: this._typeId,
      typeName: this._typeName,
    };
  }

  private static validate(props: VehicleTypeProps): void {
    if (typeof props.typeId !== 'number' || props.typeId <= 0 || !Number.isInteger(props.typeId)) {
      throw new ValidationError('typeId must be a positive integer');
    }

    if (!props.typeName || typeof props.typeName !== 'string' || props.typeName.trim() === '') {
      throw new ValidationError('typeName cannot be empty');
    }
  }
}
