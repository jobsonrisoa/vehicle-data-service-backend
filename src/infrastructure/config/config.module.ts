import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { loadConfiguration } from './configuration';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [loadConfiguration],
      isGlobal: true,
      cache: true,
      validate: loadConfiguration,
    }),
  ],
})
export class ConfigModule {}
