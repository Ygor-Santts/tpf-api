// The e2e tests run the whole API against the database in .env (see the
// README). Never point them at production: they create and delete accounts.
import * as dotenv from 'dotenv';

// Jest sets NODE_ENV=test, which the API does not accept.
if (process.env.NODE_ENV === 'test') delete process.env.NODE_ENV;
dotenv.config({ path: `${__dirname}/../.env` });
