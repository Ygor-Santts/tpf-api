import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/.env' });

import { Options } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

const config: Options<MySqlDriver> = {
  driver: MySqlDriver,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  entities: [__dirname + '/libs/**/*.entity.ts'],
  entitiesTs: [__dirname + '/libs/**/*.entity.ts'],
  migrations: {
    path: __dirname + '/libs/infra/database/migrations',
  },
};

export default config;
