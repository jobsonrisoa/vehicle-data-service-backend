import { Entity } from '../../shared/base-entity';
import { MakeId } from '../value-objects/make-id.vo';
import { VehicleType } from './vehicle-type.entity';
import { ValidationError } from '../errors/validation-error';

interface VehicleMakeProps {
  makeId: number;
  makeName: string;
}

interface VehicleMakeSnapshot extends VehicleMakeProps {
  id: MakeId;
  vehicleTypes: VehicleType[];
  createdAt: Date;
  updatedAt: Date;
}

export class VehicleMake extends Entity<MakeId> {
  private readonly _makeId: number;
  private readonly _makeName: string;
  private _vehicleTypes: VehicleType[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: MakeId,
    props: VehicleMakeProps,
    vehicleTypes: VehicleType[],
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._makeId = props.makeId;
    this._makeName = props.makeName;
    this._vehicleTypes = vehicleTypes;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get makeId(): number {
    return this._makeId;
  }

  get makeName(): string {
    return this._makeName;
  }

  get vehicleTypes(): ReadonlyArray<VehicleType> {
    return Object.freeze([...this._vehicleTypes]);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  static create(props: VehicleMakeProps): VehicleMake {
    VehicleMake.validate(props);
    const id = MakeId.create();
    const now = new Date();
    return new VehicleMake(
      id,
      { makeId: props.makeId, makeName: props.makeName.trim() },
      [],
      now,
      now,
    );
  }

  static reconstitute(snapshot: VehicleMakeSnapshot): VehicleMake {
    VehicleMake.validate({ makeId: snapshot.makeId, makeName: snapshot.makeName });
    return new VehicleMake(
      snapshot.id,
      { makeId: snapshot.makeId, makeName: snapshot.makeName.trim() },
      VehicleMake.deduplicateTypes(snapshot.vehicleTypes),
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  addVehicleType(vehicleType: VehicleType): void {
    const exists = this._vehicleTypes.some((vt) => vt.typeId === vehicleType.typeId);
    if (!exists) {
      this._vehicleTypes.push(vehicleType);
      this.touch();
    }
  }

  removeVehicleType(typeId: number): void {
    const initialLength = this._vehicleTypes.length;
    this._vehicleTypes = this._vehicleTypes.filter((vt) => vt.typeId !== typeId);
    if (this._vehicleTypes.length !== initialLength) {
      this.touch();
    }
  }

  updateVehicleTypes(vehicleTypes: VehicleType[]): void {
    this._vehicleTypes = VehicleMake.deduplicateTypes(vehicleTypes);
    this.touch();
  }

  equals(other: Entity<MakeId>): boolean {
    if (!(other instanceof VehicleMake)) {
      return false;
    }
    return this.id.equals(other.id);
  }

  toJSON(): {
    id: string;
    makeId: number;
    makeName: string;
    vehicleTypes: Array<{ id: string; typeId: number; typeName: string }>;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id.value,
      makeId: this._makeId,
      makeName: this._makeName,
      vehicleTypes: this._vehicleTypes.map((vt) => vt.toJSON()),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  private static validate(props: VehicleMakeProps): void {
    if (typeof props.makeId !== 'number' || props.makeId <= 0 || !Number.isInteger(props.makeId)) {
      throw new ValidationError('makeId must be a positive integer');
    }

    if (!props.makeName || typeof props.makeName !== 'string' || props.makeName.trim() === '') {
      throw new ValidationError('makeName cannot be empty');
    }
  }

  private static deduplicateTypes(vehicleTypes: VehicleType[]): VehicleType[] {
    return vehicleTypes.reduce<VehicleType[]>((acc, current) => {
      const exists = acc.some((vt) => vt.typeId === current.typeId);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
