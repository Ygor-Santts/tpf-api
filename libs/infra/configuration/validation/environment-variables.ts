import { EEnvironment } from '@tpf/common';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
abstract class IEnvironmentVariables {
  @IsEnum(EEnvironment)
  @IsNotEmpty()
  NODE_ENV!: EEnvironment;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE!: string;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_ROOT_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRATION!: string;
}

export class EnvironmentVariables extends IEnvironmentVariables {}
