import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { VehicleMakeOrmEntity } from './vehicle-make.orm-entity';

/**
 * ORM Entity for VehicleType
 */
@Entity('vehicle_types')
@Unique(['typeId', 'vehicleMakeId'])
@Index(['vehicleMakeId'])
@Index(['typeId'])
export class VehicleTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'type_id', type: 'integer' })
  typeId!: number;

  @Column({ name: 'type_name', type: 'varchar', length: 255 })
  typeName!: string;

  @Column({ name: 'vehicle_make_id', type: 'uuid' })
  vehicleMakeId!: string;

  @ManyToOne(() => VehicleMakeOrmEntity, (make) => make.vehicleTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_make_id' })
  vehicleMake!: VehicleMakeOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}

