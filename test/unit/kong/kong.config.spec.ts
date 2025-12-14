import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';

interface KongPlugin {
  name: string;
  config?: Record<string, unknown>;
}

interface KongRoute {
  paths: string[];
  methods?: string[];
}

interface KongService {
  name: string;
  routes: KongRoute[];
  plugins: KongPlugin[];
  url: string;
}

interface KongConfig {
  services: KongService[];
  plugins: KongPlugin[];
}

interface RateLimitConfig {
  minute: number;
  hour?: number;
}

interface CorsConfig {
  methods?: string[];
  headers?: string[];
}

describe('Kong configuration', () => {
  const kongPath = path.resolve(__dirname, '../../../kong/kong.yml');
  const config = parse(fs.readFileSync(kongPath, 'utf-8')) as KongConfig;

  it('has required services', () => {
    const names = config.services.map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining(['vehicle-graphql', 'vehicle-api', 'health', 'swagger-docs']),
    );
  });

  it('defines graphql route with plugins', () => {
    const svc = config.services.find((s) => s.name === 'vehicle-graphql');
    expect(svc).toBeDefined();
    if (!svc) {
      throw new Error('graphql service missing');
    }
    expect(svc.url).toBe('http://app:3000/graphql');
    expect(svc.routes.some((r) => r.paths.includes('/graphql'))).toBe(true);
    const pluginNames = svc.plugins.map((p) => p.name);
    expect(pluginNames).toEqual(
      expect.arrayContaining(['rate-limiting', 'cors', 'request-size-limiting']),
    );
    const rateConfig = svc.plugins.find((p) => p.name === 'rate-limiting')?.config as
      | RateLimitConfig
      | undefined;
    expect(rateConfig?.minute).toBe(100);
    expect(rateConfig?.hour).toBe(5000);
    const corsConfig = svc.plugins.find((p) => p.name === 'cors')?.config as CorsConfig | undefined;
    expect(corsConfig?.methods).toEqual(expect.arrayContaining(['GET', 'POST', 'OPTIONS']));
    expect(corsConfig?.headers).toEqual(
      expect.arrayContaining(['Accept', 'Content-Type', 'Authorization', 'X-Request-ID']),
    );
  });

  it('defines global plugins', () => {
    const pluginNames = config.plugins.map((p) => p.name);
    expect(pluginNames).toEqual(
      expect.arrayContaining(['prometheus', 'correlation-id', 'file-log']),
    );
  });
});
