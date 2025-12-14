import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType('VehicleType')
export class VehicleTypeType {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  typeId!: number;

  @Field()
  typeName!: string;

  @Field()
  createdAt!: Date;
}

