import { ObjectType, Field, Int } from '@nestjs/graphql';

import { VehicleMakeType } from './vehicle-make.type';

@ObjectType('VehicleMakeEdge')
export class VehicleMakeEdge {
  @Field()
  cursor!: string;

  @Field(() => VehicleMakeType)
  node!: VehicleMakeType;
}

@ObjectType('PageInfo')
export class PageInfo {
  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType('VehicleMakeConnection')
export class VehicleMakeConnection {
  @Field(() => [VehicleMakeEdge])
  edges!: VehicleMakeEdge[];

  @Field(() => PageInfo)
  pageInfo!: PageInfo;

  @Field(() => Int)
  totalCount!: number;
}

