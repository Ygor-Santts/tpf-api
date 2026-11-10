import { removeAccount } from '@tpf/auth';
import { bearer, PASSWORD, TestApi } from './helpers';

const api = new TestApi();
beforeAll(() => api.start());
afterAll(() => api.stop());

describe('deleting an account', () => {
  it('removes the worker and the user together', async () => {
    const worker = await api.signUp({ worker: true, verified: true });

    await api
      .http()
      .delete('/auth/me')
      .set('Authorization', bearer(worker))
      .send({ password: PASSWORD })
      .expect(204);

    expect(
      await api.sql('select id from worker where id = ?', [worker.workerId]),
    ).toEqual([]);
    expect(
      await api.sql('select id from user where id = ?', [worker.id]),
    ).toEqual([]);
  });

  it('keeps everything when the deletion fails halfway', async () => {
    const worker = await api.signUp({ worker: true });
    // Both deletes run in the caller's transaction, so a failure after them
    // rolls them back instead of leaving half an account behind.
    const em = api.em.fork();
    await expect(
      em.transactional(async (tx) => {
        await removeAccount(tx, worker.id, worker.workerId);
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');

    expect(
      await api.sql('select id from worker where id = ?', [worker.workerId]),
    ).toHaveLength(1);
    expect(
      await api.sql('select id from user where id = ?', [worker.id]),
    ).toHaveLength(1);
  });
});
