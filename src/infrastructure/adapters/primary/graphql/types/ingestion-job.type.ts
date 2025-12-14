import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';

export enum IngestionStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(IngestionStatusEnum, {
  name: 'IngestionStatus',
});

@ObjectType('IngestionJob')
export class IngestionJobType {
  @Field(() => ID)
  id!: string;

  @Field(() => IngestionStatusEnum)
  status!: IngestionStatusEnum;

  @Field()
  startedAt!: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => Int)
  totalMakes!: number;

  @Field(() => Int)
  processedMakes!: number;

  @Field(() => Int)
  failedMakes!: number;

  @Field(() => Int)
  progress!: number;

  @Field(() => [String])
  errors!: string[];
}

