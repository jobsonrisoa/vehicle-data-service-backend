import { Entity } from '../../shared/base-entity';
import { IngestionStatus } from '../enums/ingestion-status.enum';
import { InvalidStateTransitionError } from '../errors/invalid-state-transition.error';
import { IngestionError } from '../value-objects/ingestion-error.vo';
import { JobId } from '../value-objects/job-id.vo';

interface IngestionJobSnapshot {
  id: JobId;
  status: IngestionStatus;
  totalMakes: number;
  processedMakes: number;
  failedMakes: number;
  errors: IngestionError[];
  startedAt: Date;
  completedAt: Date | null;
}

export class IngestionJob extends Entity<JobId> {
  private _status: IngestionStatus;
  private _totalMakes: number;
  private _processedMakes: number;
  private _failedMakes: number;
  private _errors: IngestionError[];
  private readonly _startedAt: Date;
  private _completedAt: Date | null;

  private constructor(snapshot: IngestionJobSnapshot) {
    super(snapshot.id);
    this._status = snapshot.status;
    this._totalMakes = snapshot.totalMakes;
    this._processedMakes = snapshot.processedMakes;
    this._failedMakes = snapshot.failedMakes;
    this._errors = snapshot.errors;
    this._startedAt = snapshot.startedAt;
    this._completedAt = snapshot.completedAt;
  }

  get status(): IngestionStatus {
    return this._status;
  }

  get totalMakes(): number {
    return this._totalMakes;
  }

  get processedMakes(): number {
    return this._processedMakes;
  }

  get failedMakes(): number {
    return this._failedMakes;
  }

  get errors(): ReadonlyArray<IngestionError> {
    return Object.freeze([...this._errors]);
  }

  get startedAt(): Date {
    return new Date(this._startedAt);
  }

  get completedAt(): Date | null {
    return this._completedAt ? new Date(this._completedAt) : null;
  }

  static create(): IngestionJob {
    const id = JobId.create();
    const now = new Date();
    return new IngestionJob({
      id,
      status: IngestionStatus.PENDING,
      totalMakes: 0,
      processedMakes: 0,
      failedMakes: 0,
      errors: [],
      startedAt: now,
      completedAt: null,
    });
  }

  static reconstitute(snapshot: IngestionJobSnapshot): IngestionJob {
    return new IngestionJob(snapshot);
  }

  start(totalMakes: number): void {
    if (this._status !== IngestionStatus.PENDING) {
      throw new InvalidStateTransitionError(`Cannot start job: current status is ${this._status}`);
    }
    this._status = IngestionStatus.IN_PROGRESS;
    this._totalMakes = totalMakes;
  }

  incrementProcessed(): void {
    this.assertInProgress('increment processed count');
    this._processedMakes += 1;
  }

  recordFailure(makeId: number, errorMessage: string): void {
    this.assertInProgress('record failure');
    this._failedMakes += 1;
    this._errors.push(IngestionError.create(makeId, errorMessage));
  }

  complete(): void {
    this.assertInProgress('complete job');
    this._status =
      this._failedMakes > 0 ? IngestionStatus.PARTIALLY_COMPLETED : IngestionStatus.COMPLETED;
    this._completedAt = new Date();
  }

  fail(reason: string): void {
    if (this.isTerminalState()) {
      throw new InvalidStateTransitionError(`Cannot fail job: current status is ${this._status}`);
    }
    this._status = IngestionStatus.FAILED;
    this._completedAt = new Date();
    this._errors.push(IngestionError.create(0, reason));
  }

  getProgress(): number {
    if (this._totalMakes === 0) {
      return 0;
    }
    const processed = this._processedMakes + this._failedMakes;
    return Math.round((processed / this._totalMakes) * 100);
  }

  getDuration(): number | null {
    if (!this._completedAt) {
      return null;
    }
    return this._completedAt.getTime() - this._startedAt.getTime();
  }

  equals(other: IngestionJob): boolean {
    if (!(other instanceof IngestionJob)) {
      return false;
    }
    return this.id.equals(other.id);
  }

  toJSON(): {
    id: string;
    status: IngestionStatus;
    totalMakes: number;
    processedMakes: number;
    failedMakes: number;
    errors: Array<{ makeId: number; errorMessage: string; occurredAt: string }>;
    startedAt: string;
    completedAt: string | null;
  } {
    return {
      id: this.id.value,
      status: this._status,
      totalMakes: this._totalMakes,
      processedMakes: this._processedMakes,
      failedMakes: this._failedMakes,
      errors: this._errors.map((error) => error.toJSON()),
      startedAt: this._startedAt.toISOString(),
      completedAt: this._completedAt ? this._completedAt.toISOString() : null,
    };
  }

  private assertInProgress(operation: string): void {
    if (this._status !== IngestionStatus.IN_PROGRESS) {
      throw new InvalidStateTransitionError(`Cannot ${operation}: job status is ${this._status}`);
    }
  }

  private isTerminalState(): boolean {
    return (
      this._status === IngestionStatus.COMPLETED ||
      this._status === IngestionStatus.PARTIALLY_COMPLETED ||
      this._status === IngestionStatus.FAILED
    );
  }
}
