import { DomainError } from './domain-error';

export class EntityNotFoundError extends DomainError {
  public readonly entityName: string;
  public readonly entityId: string;

  constructor(entityName: string, entityId: string) {
    super(`${entityName} with id ${entityId} not found`, 'ENTITY_NOT_FOUND');
    this.entityName = entityName;
    this.entityId = entityId;
  }

  public toJSON(): {
    name: string;
    message: string;
    code: string;
    timestamp: string;
    stack?: string;
    entityName: string;
    entityId: string;
  } {
    return {
      ...super.toJSON(),
      entityName: this.entityName,
      entityId: this.entityId,
    };
  }
}
