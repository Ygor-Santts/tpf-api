import { TestApi } from './helpers';

const api = new TestApi();
beforeAll(() => api.start());
afterAll(() => api.stop());

describe("a deactivated worker's public pages", () => {
  const pages = (id?: number) => [
    `/worker/${id}/profile`,
    `/worker/${id}/portfolio`,
    `/worker/${id}/ratings`,
    `/worker/${id}/rating-summary`,
  ];

  it('are open while the account is active', async () => {
    const worker = await api.signUp({ worker: true });
    for (const url of pages(worker.workerId))
      await api.http().get(url).expect(200);
  });

  it('answer 404 once the account is deactivated', async () => {
    const worker = await api.signUp({ worker: true });
    await api.sql('update user set enabled = false where id = ?', [worker.id]);
    for (const url of pages(worker.workerId))
      await api.http().get(url).expect(404);
  });
});
