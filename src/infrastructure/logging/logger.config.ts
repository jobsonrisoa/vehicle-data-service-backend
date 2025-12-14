import { Bindings, LoggerOptions } from 'pino';

export function createLoggerConfig(env: string, logLevel: string): LoggerOptions {
  const isDevelopment = env === 'development';

  const baseConfig: LoggerOptions = {
    level: logLevel,
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  };

  if (isDevelopment) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{levelLabel} - {msg}',
        },
      },
    };
  }

  return {
    ...baseConfig,
    formatters: {
      ...baseConfig.formatters,
      bindings: (bindings: Bindings) => ({
        pid: Number(bindings.pid),
        hostname: String(bindings.hostname),
        node_version: process.version,
      }),
    },
  };
}
