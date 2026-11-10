import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EntityManager } from '@mikro-orm/mysql';
import * as request from 'supertest';
import { removeAccount } from '@tpf/auth';
import { AppModule, configureApp } from '../libs/infra';
import {
  IMail,
  IMailer,
} from '../libs/core/auth/src/lib/use-cases/services/mailer';

export const PASSWORD = 'Senha@e2e123';
const DOMAIN = '@e2e.test';

/** Keeps the emails the API would send, instead of sending them. */
export class FakeMailer implements IMailer {
  sent: IMail[] = [];
  send(mail: IMail) {
    this.sent.push(mail);
  }
  tokenFor(to: string, path: string) {
    const mail = [...this.sent]
      .reverse()
      .find((m) => m.to === to && m.link.includes(path));
    return mail && new URL(mail.link).searchParams.get('token');
  }
}

let counter = 0;
const run = Date.now() % 1e7;

/** A different made-up address per call, so the per-address limits don't add up across tests. */
export function newIp() {
  counter += 1;
  return `10.${(counter >> 16) & 255}.${(counter >> 8) & 255}.${counter & 255}`;
}

export interface TestUser {
  id: number;
  email: string;
  phone: string;
  token: string;
  workerId?: number;
}

export class TestApi {
  app: NestExpressApplication;
  em: EntityManager;
  mailer = new FakeMailer();
  private emails: string[] = [];

  async start() {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(IMailer)
      .useValue(this.mailer)
      .compile();
    this.app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(this.app);
    await this.app.init();
    this.em = this.app.get(EntityManager).fork();
  }

  async stop() {
    if (!this.app) return;
    for (const email of this.emails) {
      const [user] = await this.sql(
        'select u.id, w.id as worker_id from user u left join worker w on w.user_id = u.id where u.email = ?',
        [email],
      );
      if (user)
        await removeAccount(this.em, user.id, user.worker_id ?? undefined);
    }
    await this.app.close();
  }

  /** A request from its own made-up address, unless one is given. */
  http(ip = newIp()) {
    const agent = request(this.app.getHttpServer());
    const wrap =
      (method: 'get' | 'post' | 'patch' | 'delete') => (url: string) =>
        agent[method](url).set('X-Forwarded-For', ip);
    return {
      get: wrap('get'),
      post: wrap('post'),
      patch: wrap('patch'),
      delete: wrap('delete'),
    };
  }

  sql(query: string, params: unknown[] = []): Promise<any[]> {
    return this.em.getConnection().execute(query, params);
  }

  async refs() {
    const [occupation] = await this.sql(
      'select o.id from job_occupation o join job_category c on c.id = o.category_id where o.approved and c.approved limit 1',
    );
    const [city] = await this.sql('select id from city limit 1');
    return { occupationId: Number(occupation.id), cityId: Number(city.id) };
  }

  /** Signs up a client (or a worker) and signs in. */
  async signUp(
    options: { worker?: boolean; verified?: boolean; name?: string } = {},
  ): Promise<TestUser> {
    counter += 1;
    const email = `u${run}${counter}${DOMAIN}`;
    const phone = `349${String(run * 100 + counter)
      .padStart(8, '0')
      .slice(-8)}`;
    const name = options.name ?? 'Teste Automatico';
    this.emails.push(email);

    if (options.worker) {
      const { occupationId, cityId } = await this.refs();
      await this.http()
        .post('/auth/worker/sign-up')
        .send({
          name,
          email,
          phone,
          password: PASSWORD,
          jobOccupationIds: [occupationId],
          operationCitiesIds: [cityId],
        })
        .expect(201);
    } else {
      await this.http()
        .post('/auth/client/sign-up')
        .send({ name, email, phone, password: PASSWORD })
        .expect(201);
    }
    if (options.verified)
      await this.sql('update user set email_verified = true where email = ?', [
        email,
      ]);

    const res = await this.http()
      .post('/auth/sign-in')
      .send({ email, password: PASSWORD })
      .expect(200);
    return {
      id: res.body.user.id,
      email,
      phone,
      token: res.body.access_token,
      workerId: res.body.user.workerId,
    };
  }
}

export const bearer = (user: { token: string }) => `Bearer ${user.token}`;
