export interface NhtsaConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export const getNhtsaConfig = (): NhtsaConfig => ({
  baseUrl: process.env.NHTSA_API_BASE_URL || 'https://vpic.nhtsa.dot.gov/api',
  timeout: parseInt(process.env.NHTSA_API_TIMEOUT || '30000', 10),
  maxRetries: parseInt(process.env.NHTSA_API_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.NHTSA_API_RETRY_DELAY || '1000', 10),
});

