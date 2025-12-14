import CircuitBreaker = require('opossum');

interface LoggerLike {
  debug: (meta: any, msg?: string) => void;
  info: (meta: any, msg?: string) => void;
  warn: (meta: any, msg?: string) => void;
  error: (meta: any, msg?: string) => void;
}

interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

export const createCircuitBreaker = <T>(
  fn: (...args: any[]) => Promise<T>,
  logger: LoggerLike,
  options: CircuitBreakerOptions = {},
): CircuitBreaker<any[], T> => {
  const breaker = new CircuitBreaker(fn, {
    timeout: options.timeout ?? 30000,
    errorThresholdPercentage: options.errorThresholdPercentage ?? 50,
    resetTimeout: options.resetTimeout ?? 30000,
    volumeThreshold: options.volumeThreshold ?? 5,
  });

  breaker.on('open', () => {
    logger.warn('Circuit breaker opened');
  });

  breaker.on('halfOpen', () => {
    logger.info('Circuit breaker half-open');
  });

  breaker.on('close', () => {
    logger.info('Circuit breaker closed');
  });

  breaker.on('success', (_result, latency) => {
    logger.debug({ latency }, 'Circuit breaker request succeeded');
  });

  breaker.on('failure', (error) => {
    logger.debug({ error: error.message }, 'Circuit breaker request failed');
  });

  breaker.on('reject', () => {
    logger.warn('Circuit breaker rejected request (circuit open)');
  });

  breaker.on('timeout', () => {
    logger.warn('Circuit breaker request timeout');
  });

  return breaker;
};

