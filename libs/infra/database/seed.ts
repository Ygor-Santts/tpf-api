/**
 * Test data for local development.
 *
 *   docker compose exec tpf_api npm run seed
 *
 * Every test account uses an @teste.com email and the password Teste@123.
 * Each run deletes the previous test accounts (and everything that belongs
 * to them) and creates them again, so the result is always the same.
 * Real accounts, cities and occupations are never touched.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/.env' });

import * as bcrypt from 'bcrypt';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import {
  createConnection,
  Connection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { join } from 'path';

const DOMAIN = '@teste.com';
const PASSWORD = 'Teste@123';
const UPLOADS = join(process.cwd(), 'uploads', 'portfolio');

// IBGE codes of the cities test workers serve: the 20 original cities plus
// Uberlândia and its neighbours Araguari (about 30 km) and Uberaba (about
// 100 km), and Guarulhos and Osasco next to São Paulo, to try the region filter.
const SEED_CITIES = [
  3550308, 3304557, 3106200, 4106902, 4314902, 2927408, 2611606, 2304400,
  1302603, 5300108, 1501402, 5208707, 3509502, 2111300, 2704302, 2408102,
  2211001, 2507507, 2800308, 4205407, 3170206, 3103504, 3170107, 3518800,
  3534401,
];

// Fixed-seed random numbers, so every run produces the same data.
let state = 20261006;
function random() {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));
const pick = <T>(list: T[]) => list[int(0, list.length - 1)];
function sample<T>(list: T[], count: number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const pad = (n: number) => String(n).padStart(2, '0');

const NAMES = [
  'Ana Souza',
  'Bruno Lima',
  'Carla Mendes',
  'Diego Rocha',
  'Eduarda Alves',
  'Felipe Costa',
  'Gabriela Nunes',
  'Henrique Dias',
  'Isabela Freitas',
  'João Pereira',
  'Karina Barros',
  'Lucas Martins',
  'Mariana Teixeira',
  'Nicolas Ribeiro',
  'Olívia Cardoso',
  'Paulo Araújo',
  'Quésia Moreira',
  'Rafael Gomes',
  'Sabrina Castro',
  'Tiago Carvalho',
  'Úrsula Pinto',
  'Vinícius Santos',
  'Wesley Oliveira',
  'Ximena Correia',
  'Yuri Monteiro',
  'Zélia Fernandes',
  'André Batista',
  'Beatriz Ramos',
  'Caio Duarte',
  'Daniela Farias',
  'Elias Nogueira',
  'Fernanda Lopes',
  'Gustavo Vieira',
  'Helena Cunha',
  'Igor Tavares',
  'Juliana Rezende',
  'Kevin Antunes',
  'Larissa Pires',
  'Marcos Sales',
  'Natália Brito',
];

const BIOS = [
  'Trabalho na área há mais de 10 anos. Pontual, caprichoso e com orçamento sem compromisso.',
  'Atendo residências e comércios. Deixo tudo limpo depois do serviço.',
  'Serviço de qualidade com garantia. Aceito Pix e cartão.',
  'Profissional autônomo, experiência com reformas pequenas e grandes.',
  'Faço visitas para orçamento aos sábados também. Chama no WhatsApp!',
  'Comecei ajudando meu pai e hoje tenho minha própria equipe.',
  'Material de primeira e acabamento bem feito. Confira meu portfólio.',
];

const CAPTIONS = [
  'Antes e depois da reforma',
  'Serviço finalizado',
  'Acabamento na sala',
  'Obra em andamento',
  'Cozinha nova',
  'Banheiro completo',
  'Área externa',
  undefined,
];

const COMMENTS: Record<number, string[]> = {
  5: [
    'Excelente profissional, super recomendo!',
    'Caprichoso e pontual. Voltarei a chamar.',
    'Serviço impecável e preço justo.',
  ],
  4: [
    'Muito bom, só atrasou um pouco.',
    'Ficou ótimo, recomendo.',
    'Bom trabalho e atencioso.',
  ],
  3: [
    'Serviço ok, mas poderia ser mais organizado.',
    'Razoável. Precisei pedir ajustes.',
  ],
  2: ['Demorou bem mais que o combinado.', 'Deixou bastante sujeira.'],
  1: ['Não compareceu no dia marcado.', 'Serviço mal feito, tive que refazer.'],
};

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
];

type Row = RowDataPacket & { id: number };

async function cleanUp(db: Connection) {
  const [workers] = await db.query<Row[]>(
    'select w.id from worker w join user u on u.id = w.user_id where u.email like ?',
    ['%' + DOMAIN],
  );
  for (const { id } of workers)
    rmSync(join(UPLOADS, String(id)), { recursive: true, force: true });

  // Deleting a worker cascades to its occupations, cities, portfolio and ratings,
  // and sets user.worker_id to null. Deleting a user cascades to the ratings it wrote.
  await db.query(
    'delete w from worker w join user u on u.id = w.user_id where u.email like ?',
    ['%' + DOMAIN],
  );
  const [users] = await db.query<ResultSetHeader>(
    'delete from user where email like ?',
    ['%' + DOMAIN],
  );
  return { users: users.affectedRows, workers: workers.length };
}

function portfolioImage(color: string, title: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${color}"/>
  <rect x="150" y="260" width="300" height="220" fill="#ffffff" opacity="0.85"/>
  <polygon points="120,270 300,130 480,270" fill="#ffffff" opacity="0.95"/>
  <text x="300" y="550" font-family="sans-serif" font-size="32" fill="#ffffff" text-anchor="middle">${title}</text>
</svg>`;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed recusado: NODE_ENV=production.');
    process.exit(1);
  }

  const db = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
  });

  try {
    await db.beginTransaction();

    const removed = await cleanUp(db);
    const [cities] = await db.query<Row[]>(
      'select id from city where ibge_id in (?) order by id',
      [SEED_CITIES],
    );
    const [occupations] = await db.query<Row[]>(
      'select id, name from job_occupation order by id',
    );
    if (!cities.length || !occupations.length) {
      throw new Error(
        'Cidades ou profissões vazias. Rode as migrations antes: npm run migration:up',
      );
    }

    const hash = await bcrypt.hash(PASSWORD, 10);
    let nameIndex = 0;
    async function createUser(email: string, enabled = true) {
      const n = nameIndex++;
      const [res] = await db.query<ResultSetHeader>(
        'insert into user (name, email, phone, password, enabled, createdAt, updatedAt, lastAccess) values (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          NAMES[n],
          email,
          `55119900000${pad(n)}`,
          hash,
          enabled,
          daysAgo(120 - n),
          daysAgo(120 - n),
          daysAgo(int(0, 30)),
        ],
      );
      return res.insertId;
    }

    // 10 clients only (the last one disabled), 25 workers and 5 workers who
    // also hire others (they write reviews).
    const clients: number[] = [];
    for (let i = 1; i <= 10; i++)
      clients.push(await createUser(`cliente${pad(i)}${DOMAIN}`, i !== 10));

    const workers: { id: number; userId: number }[] = [];
    const both: number[] = [];
    for (let i = 1; i <= 30; i++) {
      const isBoth = i > 25;
      const userId = await createUser(
        isBoth
          ? `ambos${pad(i - 25)}${DOMAIN}`
          : `trabalhador${pad(i)}${DOMAIN}`,
      );
      if (isBoth) both.push(userId);

      // trabalhador03 to 05 stay empty: no bio, no portfolio, no ratings.
      const empty = i >= 3 && i <= 5;
      // Destaque: trabalhador06 and 07 active for 30 days, 08 expired yesterday.
      const featuredUntil =
        i === 6 || i === 7 ? daysAgo(-30) : i === 8 ? daysAgo(1) : null;
      const [res] = await db.query<ResultSetHeader>(
        'insert into worker (user_id, bio, featured_until) values (?, ?, ?)',
        [userId, empty ? null : pick(BIOS), featuredUntil],
      );
      const workerId = res.insertId;
      await db.query('update user set worker_id = ? where id = ?', [
        workerId,
        userId,
      ]);
      workers.push({ id: workerId, userId });

      // The first occupation and city rotate, so every one of them has workers.
      const occ = [
        occupations[(i - 1) % occupations.length],
        ...sample(occupations, 2),
      ].slice(0, int(1, 3));
      const cit = [cities[(i - 1) % cities.length], ...sample(cities, 2)].slice(
        0,
        int(1, 3),
      );
      for (const o of new Set(occ.map((o) => o.id))) {
        await db.query(
          'insert into worker_job_occupations (worker_id, job_occupation_id) values (?, ?)',
          [workerId, o],
        );
      }
      for (const c of new Set(cit.map((c) => c.id))) {
        await db.query(
          'insert into worker_operation_cities (worker_id, city_id) values (?, ?)',
          [workerId, c],
        );
      }

      if (empty) continue;
      const items = int(0, 4);
      if (items)
        mkdirSync(join(UPLOADS, String(workerId)), { recursive: true });
      for (let k = 1; k <= items; k++) {
        const file = `seed-${k}.svg`;
        writeFileSync(
          join(UPLOADS, String(workerId), file),
          portfolioImage(pick(COLORS), occ[0].name),
        );
        await db.query(
          'insert into portfolio_item (worker_id, type, url, caption, createdAt) values (?, ?, ?, ?, ?)',
          [
            workerId,
            'image',
            `/uploads/portfolio/${workerId}/${file}`,
            pick(CAPTIONS) ?? null,
            daysAgo(int(1, 90)),
          ],
        );
      }
    }

    // Ratings. trabalhador01 is the star (many good ratings), trabalhador02
    // has a low average, the others get a random mix.
    const authors = [...clients.slice(0, 9), ...both];
    let ratings = 0;
    for (const [index, worker] of workers.entries()) {
      const n = index + 1;
      if (n >= 3 && n <= 5) continue;
      const count = n === 1 ? authors.length : n === 2 ? 6 : int(0, 6);
      const scoreRange: [number, number] =
        n === 1 ? [4, 5] : n === 2 ? [1, 3] : [2, 5];
      for (const author of sample(
        authors.filter((a) => a !== worker.userId),
        count,
      )) {
        const score = int(...scoreRange);
        await db.query(
          'insert into rating (worker_id, author_id, score, comment, createdAt) values (?, ?, ?, ?, ?)',
          [
            worker.id,
            author,
            score,
            random() < 0.8 ? pick(COMMENTS[score]) : null,
            daysAgo(int(1, 90)),
          ],
        );
        ratings++;
      }
    }

    await db.commit();
    console.log(`Removidos: ${removed.users} usuários de teste antigos.`);
    console.log(
      `Criados: ${clients.length} clientes, ${workers.length} trabalhadores, ${ratings} avaliações.`,
    );
    console.log(
      `Login: cliente01${DOMAIN}, trabalhador01${DOMAIN} ou ambos01${DOMAIN}, senha ${PASSWORD}`,
    );
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
