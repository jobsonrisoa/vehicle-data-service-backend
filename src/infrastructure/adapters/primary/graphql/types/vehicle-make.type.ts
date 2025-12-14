import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { VehicleTypeType } from './vehicle-type.type';

@ObjectType('VehicleMake')
export class VehicleMakeType {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  makeId!: number;

  @Field()
  makeName!: string;

  @Field(() => [VehicleTypeType])
  vehicleTypes!: VehicleTypeType[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

