import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';

interface KongPlugin {
  name: string;
}

interface KongRoute {
  paths: string[];
}

interface KongService {
  name: string;
  routes: KongRoute[];
  plugins: KongPlugin[];
}

interface KongConfig {
  services: KongService[];
  plugins: KongPlugin[];
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
    expect(svc.routes.some((r) => r.paths.includes('/graphql'))).toBe(true);
    const pluginNames = svc.plugins.map((p) => p.name);
    expect(pluginNames).toEqual(
      expect.arrayContaining(['rate-limiting', 'cors', 'request-size-limiting']),
    );
  });

  it('defines global plugins', () => {
    const pluginNames = config.plugins.map((p) => p.name);
    expect(pluginNames).toEqual(
      expect.arrayContaining(['prometheus', 'correlation-id', 'file-log']),
    );
  });
});
