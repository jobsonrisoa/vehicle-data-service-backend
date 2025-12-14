import { ApiProperty } from '@nestjs/swagger';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';

export class IngestionJobResponse {
  @ApiProperty({
    description: 'Unique job identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Current status of the ingestion job',
    enum: IngestionStatus,
    example: IngestionStatus.IN_PROGRESS,
  })
  status!: IngestionStatus;

  @ApiProperty({
    description: 'Timestamp when job started',
    type: String,
    format: 'date-time',
    example: '2024-01-01T12:00:00.000Z',
  })
  startedAt!: Date;

  @ApiProperty({
    description: 'Timestamp when job completed',
    type: String,
    format: 'date-time',
    example: '2024-01-01T12:05:30.000Z',
    nullable: true,
  })
  completedAt!: Date | null;

  @ApiProperty({ description: 'Total makes to process', example: 100 })
  totalMakes!: number;

  @ApiProperty({ description: 'Makes processed successfully', example: 80 })
  processedMakes!: number;

  @ApiProperty({ description: 'Makes failed to process', example: 2 })
  failedMakes!: number;

  @ApiProperty({ description: 'Progress percentage', example: 82 })
  progress!: number;

  @ApiProperty({
    description: 'Errors encountered during processing',
    type: [String],
    example: ['Failed to fetch types for make 123'],
  })
  errors!: string[];
}

