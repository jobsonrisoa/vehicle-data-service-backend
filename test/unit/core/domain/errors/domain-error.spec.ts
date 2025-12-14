import { DomainError } from '@domain/errors/domain-error';

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message, 'TEST_ERROR');
  }
}

describe('DomainError (Unit)', () => {
  it('should be an instance of Error', () => {
    const error = new TestDomainError('Test error');

    expect(error).toBeInstanceOf(Error);
  });

  it('should have a message', () => {
    const error = new TestDomainError('Something went wrong');

    expect(error.message).toBe('Something went wrong');
  });

  it('should have an error code', () => {
    const error = new TestDomainError('Test error');

    expect(error.code).toBe('TEST_ERROR');
  });

  it('should have a timestamp', () => {
    const beforeCreate = new Date();
    const error = new TestDomainError('Test error');
    const afterCreate = new Date();

    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should have a stack trace', () => {
    const error = new TestDomainError('Test error');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('TestDomainError');
  });

  it('should serialize to JSON', () => {
    const error = new TestDomainError('Test error');

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'TestDomainError',
      message: 'Test error',
      code: 'TEST_ERROR',
      timestamp: error.timestamp.toISOString(),
      stack: error.stack,
    });
  });

  it('should support optional metadata', () => {
    class MetadataError extends DomainError {
      constructor(
        message: string,
        public readonly metadata: Record<string, unknown>,
      ) {
        super(message, 'METADATA_ERROR');
      }

      public toJSON(): ReturnType<DomainError['toJSON']> & { metadata: Record<string, unknown> } {
        return {
          ...super.toJSON(),
          metadata: this.metadata,
        };
      }
    }

    const error = new MetadataError('Error with metadata', { userId: 123 });

    expect(error.metadata).toEqual({ userId: 123 });
    expect(error.toJSON().metadata).toEqual({ userId: 123 });
  });
});
