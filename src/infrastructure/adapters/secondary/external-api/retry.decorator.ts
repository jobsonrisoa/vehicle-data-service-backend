import axios from 'axios';

export class MaxRetriesExceededError extends Error {
  constructor(message: string, public readonly lastError: Error) {
    super(message);
    this.name = 'MaxRetriesExceededError';
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: unknown): boolean => {
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    if (status >= 400 && status < 500) {
      return false;
    }
  }
  return true;
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000,
): Promise<T> => {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (!shouldRetry(error)) {
        throw error;
      }
      if (attempt === maxAttempts) {
        throw new MaxRetriesExceededError(`Failed after ${maxAttempts} attempts`, lastError);
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  throw new MaxRetriesExceededError(`Failed after ${maxAttempts} attempts`, lastError as Error);
};

