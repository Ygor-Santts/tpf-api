import { bearer, TestApi, TestUser } from './helpers';

const api = new TestApi();
beforeAll(() => api.start());
afterAll(() => api.stop());

const CATEGORY = 'Categoria vazia de teste automatico';

describe('the app never lists a category with nothing to pick', () => {
  let admin: TestUser;
  let categoryId: number;

  const listed = async () => {
    const res = await api.http().get('/job/categories').expect(200);
    return res.body.map((c: { id: number }) => c.id);
  };

  beforeAll(async () => {
    admin = await api.signUp();
    await api.sql('update user set is_admin = true where id = ?', [admin.id]);
  });

  afterAll(async () => {
    if (!categoryId) return;
    await api.sql('delete from job_occupation where category_id = ?', [
      categoryId,
    ]);
    await api.sql('delete from job_category where id = ?', [categoryId]);
  });

  it('hides an approved category that has no approved occupation', async () => {
    // A worker suggests it; the admin approves the category but not the occupation.
    const res = await api
      .http()
      .post('/job/occupations')
      .send({ name: 'Profissao em analise', categoryName: CATEGORY })
      .expect(201);
    categoryId = res.body.categoryId;
    await api
      .http()
      .patch(`/admin/categories/${categoryId}`)
      .set('Authorization', bearer(admin))
      .send({ approved: true })
      .expect(204);

    expect(await listed()).not.toContain(categoryId);
  });

  it('shows it once the admin adds an occupation there', async () => {
    await api.sql('update job_category set approved = false where id = ?', [
      categoryId,
    ]);
    await api
      .http()
      .post(`/admin/categories/${categoryId}/occupations`)
      .set('Authorization', bearer(admin))
      .send({ name: 'Profissao criada pelo admin' })
      .expect(204);

    // Creating the occupation also approved the pending category.
    expect(await listed()).toContain(categoryId);
    const occupations = await api
      .http()
      .get(`/job/category/${categoryId}/occupations`)
      .expect(200);
    expect(occupations.body.map((o: { name: string }) => o.name)).toEqual([
      'Profissao criada pelo admin',
    ]);
  });
});
