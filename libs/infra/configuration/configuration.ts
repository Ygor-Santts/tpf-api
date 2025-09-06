import * as process from 'process';

export interface IConfiguration {
  env: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    expiration: string;
  };
}

export const configuration = (): IConfiguration => ({
  env: process.env.NODE_ENV,
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION,
  },
});
