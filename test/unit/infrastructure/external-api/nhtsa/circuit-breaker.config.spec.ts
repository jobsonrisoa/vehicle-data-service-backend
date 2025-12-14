import CircuitBreaker from 'opossum';

import { createCircuitBreaker } from '@infrastructure/adapters/secondary/external-api/nhtsa/circuit-breaker.config';

describe('Circuit Breaker', () => {
  let logger: any;

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  it('creates circuit breaker with defaults', () => {
    const fn = jest.fn();
    const breaker = createCircuitBreaker(fn, logger);
    const options = (breaker as any).options;
    expect(options.timeout).toBe(30000);
    expect(options.errorThresholdPercentage).toBe(50);
    expect(options.resetTimeout).toBe(30000);
  });

  it('allows requests when closed', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const breaker = createCircuitBreaker(fn, logger);
    const result = await breaker.fire();
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('opens after threshold failures', async () => {
    let callCount = 0;
    const fn = jest.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount <= 5) {
        throw new Error('Service unavailable');
      }
      return 'ok';
    });
    const breaker = createCircuitBreaker(fn, logger);
    for (let i = 0; i < 5; i += 1) {
      try {
        await breaker.fire();
      } catch (error) {
        // expected
      }
    }
    expect(breaker.opened).toBe(true);
  });

  it('rejects when open', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const breaker = createCircuitBreaker(fn, logger);
    for (let i = 0; i < 5; i += 1) {
      try {
        await breaker.fire();
      } catch (error) {
        // expected
      }
    }
    await expect(breaker.fire()).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it('transitions to half-open after reset timeout', async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn()
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockResolvedValue('success');
    const breaker = createCircuitBreaker(fn, logger);
    for (let i = 0; i < 5; i += 1) {
      try {
        await breaker.fire();
      } catch (error) {
        // expected
      }
    }
    jest.advanceTimersByTime(31000);
    const result = await breaker.fire();
    expect(result).toBe('success');
    jest.useRealTimers();
  });

  it('closes after success in half-open', async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn()
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockRejectedValue(new Error('fail'))
      .mockResolvedValue('ok');
    const breaker = createCircuitBreaker(fn, logger);
    for (let i = 0; i < 5; i += 1) {
      try {
        await breaker.fire();
      } catch (error) {
        // expected
      }
    }
    jest.advanceTimersByTime(31000);
    await breaker.fire();
    expect(breaker.closed).toBe(true);
    jest.useRealTimers();
  });

  it('logs open/half-open/close', async () => {
    jest.useFakeTimers();
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const breaker = createCircuitBreaker(fn, logger, {
      resetTimeout: 10,
      volumeThreshold: 1,
      errorThresholdPercentage: 1,
      timeout: 1000,
    });
    try {
      await breaker.fire();
    } catch (error) {
      // expected
    }
    expect(logger.warn).toHaveBeenCalledWith('Circuit breaker opened');
    logger.info.mockClear();
    fn.mockResolvedValueOnce('ok');
    jest.advanceTimersByTime(20);
    await breaker.fire();
    expect(logger.info).toHaveBeenCalledWith('Circuit breaker half-open');
    expect(logger.info).toHaveBeenCalledWith('Circuit breaker closed');
    jest.useRealTimers();
  });
});

