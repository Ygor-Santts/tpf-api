/**
 * Gives an account access to the admin area, found by its email.
 *
 *   npm run admin -- email@exemplo.com
 *   npm run admin -- email@exemplo.com --remover
 *
 * On the server: dc exec api npm run admin -- email@exemplo.com
 *
 * Sign out and in again in the app to see the "Admin" menu.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/.env' });

import { createConnection, ResultSetHeader } from 'mysql2/promise';

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email || (flag && flag !== '--remover')) {
    console.error('Uso: npm run admin -- email@exemplo.com [--remover]');
    process.exit(1);
  }
  const admin = flag !== '--remover';

  const db = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [result] = await db.query<ResultSetHeader>(
      'update user set is_admin = ? where email = ?',
      [admin, email],
    );
    if (!result.affectedRows) {
      console.error(`Nenhuma conta com o email ${email}.`);
      process.exit(1);
    }
    console.log(
      admin
        ? `${email} agora é admin. Saia e entre de novo no app.`
        : `${email} não é mais admin.`,
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
