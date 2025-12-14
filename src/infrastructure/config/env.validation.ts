import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV!: string;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  DATABASE_HOST?: string;

  @IsOptional()
  @IsNumber()
  DATABASE_PORT?: number;

  @IsOptional()
  @IsString()
  DATABASE_USERNAME?: string;

  @IsOptional()
  @IsString()
  DATABASE_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DATABASE_NAME?: string;

  @IsOptional()
  @IsNumber()
  DATABASE_POOL_SIZE?: number;

  @IsOptional()
  @IsBoolean()
  DATABASE_SSL?: boolean;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

