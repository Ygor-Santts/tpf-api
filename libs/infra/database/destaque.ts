/**
 * Turns on the paid "Destaque" for a worker, found by the account email.
 *
 *   docker compose exec tpf_api npm run destaque -- email@exemplo.com 30
 *
 * Days are added to an active Destaque, or start today. 0 days turns it off.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/.env' });

import { createConnection, RowDataPacket } from 'mysql2/promise';

async function main() {
  const [email, daysArg] = process.argv.slice(2);
  const days = Number(daysArg);
  if (!email || !Number.isInteger(days) || days < 0) {
    console.error('Uso: npm run destaque -- email@exemplo.com 30');
    process.exit(1);
  }

  const db = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'select w.id from worker w join user u on u.id = w.user_id where u.email = ?',
      [email],
    );
    if (!rows.length) {
      console.error(`Nenhum trabalhador com o email ${email}.`);
      process.exit(1);
    }

    await db.query(
      days === 0
        ? 'update worker set featured_until = null where id = ?'
        : 'update worker set featured_until = greatest(coalesce(featured_until, now()), now()) + interval ? day where id = ?',
      days === 0 ? [rows[0].id] : [days, rows[0].id],
    );
    const [[worker]] = await db.query<RowDataPacket[]>(
      "select date_format(featured_until, '%d/%m/%Y %H:%i') as until from worker where id = ?",
      [rows[0].id],
    );
    console.log(
      worker.until
        ? `${email} em destaque até ${worker.until}.`
        : `Destaque de ${email} desligado.`,
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
