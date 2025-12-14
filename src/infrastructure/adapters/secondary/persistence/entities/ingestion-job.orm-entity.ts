import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export interface IngestionJobError {
  makeId: number;
  makeName?: string;
  message: string;
  timestamp: string;
}

@Entity('ingestion_jobs')
@Index(['status'])
@Index(['startedAt'])
export class IngestionJobOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status!: string;

  @Column({ name: 'started_at', type: 'timestamp with time zone' })
  startedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'total_makes', type: 'integer', default: 0 })
  totalMakes!: number;

  @Column({ name: 'processed_makes', type: 'integer', default: 0 })
  processedMakes!: number;

  @Column({ name: 'failed_makes', type: 'integer', default: 0 })
  failedMakes!: number;

  @Column({
    type: 'jsonb',
    default: '[]',
    transformer: {
      to: (value: IngestionJobError[]): string => JSON.stringify(value || []),
      from: (value: string): IngestionJobError[] => {
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return value || [];
      },
    },
  })
  errors!: IngestionJobError[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}

