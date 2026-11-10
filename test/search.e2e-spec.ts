import { TestApi, TestUser } from './helpers';

const api = new TestApi();
beforeAll(() => api.start());
afterAll(() => api.stop());

const CATEGORY = 'Categoria pendente de teste automatico';

describe('search ignores occupations and categories still under review', () => {
  let worker: TestUser;
  let approvedOccupationId: number;
  let pendingOccupationId: number;
  let pendingCategoryId: number;

  beforeAll(async () => {
    worker = await api.signUp({ worker: true, name: 'Odete Buscapendente' });
    approvedOccupationId = (await api.refs()).occupationId;

    // A worker suggests a new occupation in a new category: both stay pending.
    const res = await api
      .http()
      .post('/job/occupations')
      .send({ name: 'Profissao pendente', categoryName: CATEGORY })
      .expect(201);
    expect(res.body.pending).toBe(true);
    pendingOccupationId = res.body.id;
    pendingCategoryId = res.body.categoryId;
    await api.sql(
      'insert into worker_job_occupations (worker_id, job_occupation_id) values (?, ?)',
      [worker.workerId, pendingOccupationId],
    );
  });

  afterAll(async () => {
    await api.sql(
      'delete from worker_job_occupations where job_occupation_id = ?',
      [pendingOccupationId],
    );
    await api.sql('delete from job_occupation where category_id = ?', [
      pendingCategoryId,
    ]);
    await api.sql('delete from job_category where id = ?', [pendingCategoryId]);
  });

  const search = async (query: string) => {
    const res = await api
      .http()
      .get(`/worker/paginated?page=1&limit=50&name=Buscapendente&${query}`)
      .expect(200);
    return res.body.data.map((w: { id: number }) => w.id);
  };

  it('does not find the worker by a pending occupation', async () => {
    expect(await search(`jobOccupationIds=${pendingOccupationId}`)).toEqual([]);
  });

  it('does not find the worker by a pending category', async () => {
    expect(await search(`jobCategoriyIds=${pendingCategoryId}`)).toEqual([]);
  });

  it('still finds the worker by an approved occupation', async () => {
    expect(await search(`jobOccupationIds=${approvedOccupationId}`)).toEqual([
      worker.workerId,
    ]);
  });

  it('finds the worker again once the admin approves them', async () => {
    await api.sql('update job_category set approved = true where id = ?', [
      pendingCategoryId,
    ]);
    await api.sql('update job_occupation set approved = true where id = ?', [
      pendingOccupationId,
    ]);
    expect(await search(`jobOccupationIds=${pendingOccupationId}`)).toEqual([
      worker.workerId,
    ]);
    expect(await search(`jobCategoriyIds=${pendingCategoryId}`)).toEqual([
      worker.workerId,
    ]);
  });

  it('applies the occupation and category filters together', async () => {
    const [{ category_id }] = await api.sql(
      'select category_id from job_occupation where id = ?',
      [approvedOccupationId],
    );
    // The approved occupation is not in the test category, so no match.
    if (Number(category_id) !== pendingCategoryId)
      expect(
        await search(
          `jobOccupationIds=${approvedOccupationId}&jobCategoriyIds=${pendingCategoryId}`,
        ),
      ).toEqual([]);
  });
});
