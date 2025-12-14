import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';

import { NhtsaConfig } from '@infrastructure/config/nhtsa.config';

interface LoggerLike {
  debug: (meta: any, msg?: string) => void;
  error: (meta: any, msg?: string) => void;
}

export const createNhtsaHttpClient = (config: NhtsaConfig, logger: LoggerLike): AxiosInstance => {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      Accept: 'application/xml',
      'User-Agent': 'Vehicle-Data-Service/1.0',
    },
    httpAgent: new http.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
    }),
    httpsAgent: new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
    }),
    validateStatus: (status) => status >= 200 && status < 300,
  });

  client.interceptors.request.use(
    (request) => {
      logger.debug(
        {
          url: request.url,
          method: request.method?.toUpperCase(),
          baseURL: request.baseURL,
        },
        'Outgoing HTTP request',
      );
      return request;
    },
    (error) => {
      logger.error({ error: error.message }, 'Request interceptor error');
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      logger.debug(
        {
          url: response.config.url,
          status: response.status,
          statusText: response.statusText,
          dataLength: response.data?.length || 0,
        },
        'HTTP response received',
      );
      return response;
    },
    (error) => {
      if (error.response) {
        logger.error(
          {
            url: error.config?.url,
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          },
          'HTTP response error',
        );
      } else if (error.request) {
        logger.error(
          {
            url: error.config?.url,
            message: error.message,
          },
          'HTTP request error (no response)',
        );
      } else {
        logger.error({ error: error.message }, 'HTTP client error');
      }
      return Promise.reject(error);
    },
  );

  return client;
};

