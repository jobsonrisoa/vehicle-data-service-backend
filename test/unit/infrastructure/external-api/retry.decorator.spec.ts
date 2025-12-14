import axios from 'axios';

import { MaxRetriesExceededError, retryWithBackoff } from '@infrastructure/adapters/secondary/external-api/retry.decorator';

describe('retryWithBackoff', () => {
  it('returns on first success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const resultPromise = retryWithBackoff(fn);
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure then succeeds', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('success');
    const resultPromise = retryWithBackoff(fn, 3, 1);
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('respects max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'));
    const resultPromise = retryWithBackoff(fn, 3, 1);
    await expect(resultPromise).rejects.toThrow(MaxRetriesExceededError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses exponential backoff', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const delays: number[] = [];
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((callback, delay) => {
      delays.push(delay as number);
      return originalSetTimeout(callback, 0);
    }) as any;
    try {
      await retryWithBackoff(fn, 3, 1000);
    } catch (error) {
      // expected
    }
    expect(delays).toEqual([1000, 2000]);
    global.setTimeout = originalSetTimeout;
  });

  it('throws after max retries exceeded', async () => {
    const originalError = new Error('persistent failure');
    const fn = jest.fn().mockRejectedValue(originalError);
    const resultPromise = retryWithBackoff(fn, 3, 1);
    await expect(resultPromise).rejects.toThrow(MaxRetriesExceededError);
    await expect(resultPromise).rejects.toThrow('Failed after 3 attempts');
  });

  it('does not retry on 400 errors', async () => {
    const error = {
      response: { status: 400 },
      isAxiosError: true,
    };
    const fn = jest.fn().mockRejectedValue(error);
    await expect(retryWithBackoff(fn)).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 404 errors', async () => {
    const error = {
      response: { status: 404 },
      isAxiosError: true,
    };
    const fn = jest.fn().mockRejectedValue(error);
    await expect(retryWithBackoff(fn)).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 errors', async () => {
    const error = {
      response: { status: 500 },
      isAxiosError: true,
    };
    const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success');
    const resultPromise = retryWithBackoff(fn, 3, 1);
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 errors', async () => {
    const error = {
      response: { status: 503 },
      isAxiosError: true,
    };
    const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success');
    const resultPromise = retryWithBackoff(fn, 3, 1);
    const result = await resultPromise;
    expect(result).toBe('success');
  });

  it('retries on network errors without response', async () => {
    const error = {
      request: {},
      isAxiosError: true,
    };
    const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success');
    const resultPromise = retryWithBackoff(fn, 3, 1);
    const result = await resultPromise;
    expect(result).toBe('success');
  });
});

