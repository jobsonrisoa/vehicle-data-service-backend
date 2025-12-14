import { InputType, Field, Int } from '@nestjs/graphql';

@InputType('VehicleMakeFilter')
export class VehicleMakeFilterInput {
  @Field({ nullable: true })
  makeName?: string;

  @Field({ nullable: true })
  hasVehicleTypes?: boolean;
}

@InputType('PaginationInput')
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  first?: number;

  @Field({ nullable: true })
  after?: string;
}

