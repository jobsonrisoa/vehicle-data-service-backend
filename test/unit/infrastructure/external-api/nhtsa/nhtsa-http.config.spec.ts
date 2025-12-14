import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createNhtsaHttpClient } from '@infrastructure/adapters/secondary/external-api/nhtsa/nhtsa-http.config';
import { NhtsaConfig } from '@infrastructure/config/nhtsa.config';

describe('createNhtsaHttpClient', () => {
  let logger: any;
  let config: NhtsaConfig;

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    config = {
      baseUrl: 'https://vpic.nhtsa.dot.gov/api',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    };
  });

  it('creates axios instance with config', () => {
    const client = createNhtsaHttpClient(config, logger);
    expect(client.defaults.baseURL).toBe(config.baseUrl);
    expect(client.defaults.timeout).toBe(config.timeout);
    expect(client.defaults.headers['Accept']).toBe('application/xml');
    expect(client.defaults.headers['User-Agent']).toBe('Vehicle-Data-Service/1.0');
    expect(client.defaults.httpAgent).toBeDefined();
    expect(client.defaults.httpsAgent).toBeDefined();
  });

  it('logs outgoing requests', async () => {
    const client = createNhtsaHttpClient(config, logger);
    const mock = new MockAdapter(client);
    mock.onGet('/test').reply(200, '<response/>');

    await client.get('/test');

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'GET',
      }),
      'Outgoing HTTP request',
    );
  });

  it('logs successful responses', async () => {
    const client = createNhtsaHttpClient(config, logger);
    const mock = new MockAdapter(client);
    mock.onGet('/test').reply(200, '<response>data</response>');

    await client.get('/test');

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        status: 200,
      }),
      'HTTP response received',
    );
  });

  it('logs error responses', async () => {
    const client = createNhtsaHttpClient(config, logger);
    const mock = new MockAdapter(client);
    mock.onGet('/test').reply(500, 'err');

    await expect(client.get('/test')).rejects.toBeDefined();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
      }),
      'HTTP response error',
    );
  });

  it('logs network errors', async () => {
    const client = createNhtsaHttpClient(config, logger);
    const mock = new MockAdapter(client);
    mock.onGet('/test').networkError();

    await expect(client.get('/test')).rejects.toBeDefined();
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ error: 'Network Error' }), 'HTTP client error');
  });

  it('logs timeout errors', async () => {
    const client = createNhtsaHttpClient(config, logger);
    const mock = new MockAdapter(client);
    mock.onGet('/test').timeout();

    await expect(client.get('/test')).rejects.toBeDefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

