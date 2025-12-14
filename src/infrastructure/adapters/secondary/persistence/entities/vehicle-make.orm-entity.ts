import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { VehicleTypeOrmEntity } from './vehicle-type.orm-entity';

/**
 * ORM Entity for VehicleMake aggregate root
 */
@Entity('vehicle_makes')
@Index(['makeId'], { unique: true })
@Index(['makeName'])
export class VehicleMakeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'make_id', type: 'integer', unique: true })
  makeId!: number;

  @Column({ name: 'make_name', type: 'varchar', length: 255 })
  makeName!: string;

  @OneToMany(() => VehicleTypeOrmEntity, (type) => type.vehicleMake, {
    cascade: true,
    eager: true,
  })
  vehicleTypes!: VehicleTypeOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}

