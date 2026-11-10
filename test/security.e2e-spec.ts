import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { JwtService } from '@nestjs/jwt';
import { bearer, PASSWORD, TestApi, TestUser } from './helpers';

// Each block covers one finding of the security review (A1, A2, M1–M6).

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);
const UPLOADS = join(process.cwd(), 'uploads', 'portfolio');
const filesIn = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).length : 0;

const api = new TestApi();
beforeAll(() => api.start());
afterAll(() => api.stop());

describe('A1: a login stops working when the account changes', () => {
  it('rejects the token of a deactivated account', async () => {
    const admin = await api.signUp();
    await api.sql('update user set is_admin = true where id = ?', [admin.id]);
    const worker = await api.signUp({ worker: true, verified: true });

    await api
      .http()
      .patch(`/admin/users/${worker.id}`)
      .set('Authorization', bearer(admin))
      .send({ enabled: false })
      .expect(204);

    await api
      .http()
      .get('/auth/me')
      .set('Authorization', bearer(worker))
      .expect(401);
    await api
      .http()
      .patch('/worker/profile')
      .set('Authorization', bearer(worker))
      .send({ bio: 'x' })
      .expect(401);
    await api
      .http()
      .post('/worker/1/ratings')
      .set('Authorization', bearer(worker))
      .send({ score: 1 })
      .expect(401);
  });

  it('rejects the token of a deleted account', async () => {
    const client = await api.signUp({ verified: true });
    await api
      .http()
      .delete('/auth/me')
      .set('Authorization', bearer(client))
      .send({ password: PASSWORD })
      .expect(204);

    await api
      .http()
      .get('/auth/me')
      .set('Authorization', bearer(client))
      .expect(401);
    await api
      .http()
      .post('/worker/1/ratings')
      .set('Authorization', bearer(client))
      .send({ score: 3 })
      .expect(401);
  });

  it('signs out older logins when the password is reset', async () => {
    const client = await api.signUp();
    await api
      .http()
      .post('/auth/forgot-password')
      .send({ email: client.email })
      .expect(204);
    const token = api.mailer.tokenFor(client.email, '/reset-password');

    await api
      .http()
      .post('/auth/reset-password')
      .send({ token, password: 'NovaSenha123' })
      .expect(204);

    await api
      .http()
      .get('/auth/me')
      .set('Authorization', bearer(client))
      .expect(401);
    const res = await api
      .http()
      .post('/auth/sign-in')
      .send({ email: client.email, password: 'NovaSenha123' })
      .expect(200);
    await api
      .http()
      .get('/auth/me')
      .set('Authorization', `Bearer ${res.body.access_token}`)
      .expect(200);
  });

  it('keeps accepting tokens issued before token versions existed', async () => {
    const client = await api.signUp();
    const old = api.app
      .get(JwtService)
      .sign({ email: client.email, userId: client.id, isWorker: false });
    await api
      .http()
      .get('/auth/me')
      .set('Authorization', `Bearer ${old}`)
      .expect(200);
  });

  it('treats a deactivated account as a visitor on public routes', async () => {
    // Its own worker, so the search has a result even on an empty database.
    await api.signUp({ worker: true, name: 'Zelia Desativadoteste' });
    const client = await api.signUp({ verified: true });
    await api.sql('update user set enabled = false where id = ?', [client.id]);
    const res = await api
      .http()
      .get('/worker/paginated?page=1&limit=5&name=Desativadoteste')
      .set('Authorization', bearer(client))
      .expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].phone).toBeUndefined();
  });
});

describe('A2: portfolio uploads leave no stray files', () => {
  it('refuses a client before writing anything', async () => {
    const client = await api.signUp();
    const before = filesIn(join(UPLOADS, 'undefined'));
    await api
      .http()
      .post('/worker/portfolio')
      .set('Authorization', bearer(client))
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(403);
    expect(filesIn(join(UPLOADS, 'undefined'))).toBe(before);
  });

  it('deletes a file whose content is not what it claims', async () => {
    const worker = await api.signUp({ worker: true });
    const dir = join(UPLOADS, String(worker.workerId));
    const before = filesIn(dir);
    await api
      .http()
      .post('/worker/portfolio')
      .set('Authorization', bearer(worker))
      .attach('file', Buffer.from('<html><script>alert(1)</script></html>'), {
        filename: 'a.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(filesIn(dir)).toBe(before);
  });

  it('deletes the file when the caption is too long', async () => {
    const worker = await api.signUp({ worker: true });
    const dir = join(UPLOADS, String(worker.workerId));
    const before = filesIn(dir);
    await api
      .http()
      .post('/worker/portfolio')
      .set('Authorization', bearer(worker))
      .field('caption', 'c'.repeat(201))
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(400);
    expect(filesIn(dir)).toBe(before);
  });

  it('saves a real image and refuses more than 30 items', async () => {
    const worker = await api.signUp({ worker: true });
    const before = filesIn(join(UPLOADS, String(worker.workerId)));
    const upload = () =>
      api
        .http()
        .post('/worker/portfolio')
        .set('Authorization', bearer(worker))
        .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });

    const res = await upload().expect(201);
    await api.http().get(res.body.url).expect(200);

    for (let i = 1; i < 30; i++)
      await api.sql(
        "insert into portfolio_item (worker_id, type, url) values (?, 'image', '/uploads/x.png')",
        [worker.workerId],
      );
    await upload().expect(400);
    expect(filesIn(join(UPLOADS, String(worker.workerId)))).toBe(before + 1);
  });
});

describe('M1: sign-in limits', () => {
  it('blocks an email after 5 wrong passwords, even with the right one', async () => {
    const client = await api.signUp();
    for (let i = 0; i < 5; i++)
      await api
        .http()
        .post('/auth/sign-in')
        .send({ email: client.email, password: `errada${i}` })
        .expect(404);
    await api
      .http()
      .post('/auth/sign-in')
      .send({ email: client.email, password: PASSWORD })
      .expect(429);
  });

  it('allows 30 attempts per address in 15 minutes', async () => {
    const http = api.http('192.0.2.1');
    for (let i = 0; i < 30; i++)
      await http
        .post('/auth/sign-in')
        .send({ email: `ninguem${i}@e2e.test`, password: 'x' })
        .expect(404);
    await http
      .post('/auth/sign-in')
      .send({ email: 'outro@e2e.test', password: 'x' })
      .expect(429);
  });

  it('allows 10 sign-ups per address an hour', async () => {
    const http = api.http('192.0.2.2');
    // The limit is checked before the body, so invalid sign-ups count too.
    for (let i = 0; i < 10; i++)
      await http.post('/auth/client/sign-up').send({}).expect(400);
    await http.post('/auth/worker/sign-up').send({}).expect(429);
  });
});

describe('M2: password reset limits', () => {
  it('sends at most one email a minute to the same address', async () => {
    const client = await api.signUp();
    const count = () =>
      api.mailer.sent.filter(
        (m) => m.to === client.email && m.link.includes('/reset-password'),
      ).length;
    await api
      .http()
      .post('/auth/forgot-password')
      .send({ email: client.email })
      .expect(204);
    await api
      .http()
      .post('/auth/forgot-password')
      .send({ email: client.email })
      .expect(204);
    expect(count()).toBe(1);
  });

  it('allows 10 requests per address an hour', async () => {
    const http = api.http('192.0.2.3');
    for (let i = 0; i < 10; i++)
      await http
        .post('/auth/forgot-password')
        .send({ email: `ninguem${i}@e2e.test` })
        .expect(204);
    await http
      .post('/auth/forgot-password')
      .send({ email: 'outro@e2e.test' })
      .expect(429);
  });
});

describe('M3: worker phones only for confirmed emails', () => {
  let worker: TestUser;
  beforeAll(async () => {
    worker = await api.signUp({ worker: true, name: 'Zuleica Contatoteste' });
  });
  const search = (token?: string) => {
    const req = api
      .http()
      .get('/worker/paginated?page=1&limit=10&name=Contatoteste');
    return (token ? req.set('Authorization', `Bearer ${token}`) : req).expect(
      200,
    );
  };
  const profile = (token?: string) => {
    const req = api.http().get(`/worker/${worker.workerId}/profile`);
    return (token ? req.set('Authorization', `Bearer ${token}`) : req).expect(
      200,
    );
  };

  it('hides the phone from visitors and unconfirmed accounts', async () => {
    const unconfirmed = await api.signUp();
    for (const token of [undefined, unconfirmed.token]) {
      expect((await search(token)).body.data[0].phone).toBeUndefined();
      expect((await profile(token)).body.user.phone).toBeUndefined();
    }
  });

  it('shows the phone to confirmed accounts', async () => {
    const confirmed = await api.signUp({ verified: true });
    expect((await search(confirmed.token)).body.data[0].phone).toBe(
      worker.phone,
    );
    expect((await profile(confirmed.token)).body.user.phone).toBe(worker.phone);
  });
});

describe('M4: ratings', () => {
  let worker: TestUser;
  beforeAll(async () => {
    worker = await api.signUp({ worker: true });
  });

  it('needs a confirmed email', async () => {
    const client = await api.signUp();
    await api
      .http()
      .post(`/worker/${worker.workerId}/ratings`)
      .set('Authorization', bearer(client))
      .send({ score: 5 })
      .expect(403);
  });

  it('limits the comment to 1000 characters', async () => {
    const client = await api.signUp({ verified: true });
    const rate = (comment: string) =>
      api
        .http()
        .post(`/worker/${worker.workerId}/ratings`)
        .set('Authorization', bearer(client))
        .send({ score: 4, comment });
    await rate('c'.repeat(1001)).expect(400);
    await rate('c'.repeat(1000)).expect(201);
  });

  it('caps the page size of the list and accepts odd pages', async () => {
    const res = await api
      .http()
      .get(`/worker/${worker.workerId}/ratings?limit=100000`)
      .expect(200);
    expect(res.body.limit).toBe(50);
    await api
      .http()
      .get(`/worker/${worker.workerId}/ratings?page=0`)
      .expect(200);
    await api
      .http()
      .get(`/worker/${worker.workerId}/ratings?page=abc&limit=abc`)
      .expect(200);
  });
});

describe('M5: adding occupations without an account', () => {
  it('allows 20 per address an hour', async () => {
    const http = api.http('192.0.2.4');
    const body = {
      name: 'Profissao de teste',
      categoryName: 'Categoria de teste automatico',
    };
    try {
      for (let i = 0; i < 20; i++)
        await http.post('/job/occupations').send(body).expect(201);
      await http.post('/job/occupations').send(body).expect(429);
    } finally {
      await api.sql(
        "delete o from job_occupation o join job_category c on c.id = o.category_id where c.name = 'Categoria de teste automatico'",
      );
      await api.sql(
        "delete from job_category where name = 'Categoria de teste automatico'",
      );
    }
  });
});

describe('M6: sign-in does not reveal which emails exist', () => {
  it('gives the same answer for an unknown email and a wrong password', async () => {
    const client = await api.signUp();
    const unknown = await api
      .http()
      .post('/auth/sign-in')
      .send({ email: 'ninguem-mesmo@e2e.test', password: 'x' });
    const wrong = await api
      .http()
      .post('/auth/sign-in')
      .send({ email: client.email, password: 'x' });
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual(wrong.body);
  });
});

describe('access control that already worked', () => {
  it('keeps the admin routes for admins', async () => {
    const worker = await api.signUp({ worker: true });
    await api.http().get('/admin/users').expect(401);
    await api
      .http()
      .get('/admin/users')
      .set('Authorization', bearer(worker))
      .expect(403);
  });

  it("does not let a worker delete someone else's portfolio item", async () => {
    const owner = await api.signUp({ worker: true });
    const other = await api.signUp({ worker: true });
    const res = await api
      .http()
      .post('/worker/portfolio')
      .set('Authorization', bearer(owner))
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(201);
    await api
      .http()
      .delete(`/worker/portfolio/${res.body.id}`)
      .set('Authorization', bearer(other))
      .expect(403);
  });
});
