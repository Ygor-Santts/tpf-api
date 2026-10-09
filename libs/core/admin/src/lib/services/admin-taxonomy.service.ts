import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { ApiProperty } from '@nestjs/swagger';
import { JobCategory, JobOccupation } from '@tpf/common';

export class AdminOccupationDTO {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() approved!: boolean;
  @ApiProperty({ description: 'Workers that have this occupation' })
  workers!: number;
}

export class AdminCategoryDTO {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() approved!: boolean;
  @ApiProperty({ type: AdminOccupationDTO, isArray: true })
  occupations!: AdminOccupationDTO[];
}

// "  pedreiro   de obra " -> "Pedreiro de obra"
const tidy = (name: string) => {
  const clean = name.trim().replace(/\s+/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

// Names match ignoring case and accents, so "Eletrica" finds "Elétrica".
const sameName = (a: string, b: string) =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0;

/**
 * Admin review of categories and occupations: approve what workers added, fix
 * names, merge duplicates and delete what nobody uses. Merging moves the
 * workers over, so no one loses an occupation from their profile.
 */
@Injectable()
export class AdminTaxonomyService {
  constructor(private readonly em: EntityManager) {}

  /** Everything, waiting-for-review first, with how many workers use each occupation. */
  async list(): Promise<AdminCategoryDTO[]> {
    const categories = await this.em.execute(
      'select id, name, approved from job_category order by approved, name',
    );
    const occupations = await this.em.execute(
      `select o.id, o.name, o.approved, o.category_id, count(wo.worker_id) as workers
        from job_occupation o
        left join worker_job_occupations wo on wo.job_occupation_id = o.id
        group by o.id
        order by o.approved, o.name`,
    );
    return categories.map((c: any) => ({
      id: Number(c.id),
      name: c.name,
      approved: Boolean(c.approved),
      occupations: occupations
        .filter((o: any) => Number(o.category_id) === Number(c.id))
        .map((o: any) => ({
          id: Number(o.id),
          name: o.name,
          approved: Boolean(o.approved),
          workers: Number(o.workers),
        })),
    }));
  }

  async createCategory(name: string): Promise<void> {
    const clean = tidy(name);
    await this.assertFreeCategoryName(clean);
    await this.em.persistAndFlush(new JobCategory({ name: clean }));
  }

  async updateCategory(
    id: number,
    changes: { name?: string; approved?: boolean },
  ): Promise<void> {
    const category = await this.findCategory(id);
    if (changes.name !== undefined) {
      const clean = tidy(changes.name);
      await this.assertFreeCategoryName(clean, id);
      category.name = clean;
    }
    if (changes.approved !== undefined) category.approved = changes.approved;
    await this.em.flush();
  }

  /**
   * Moves every occupation of the category into another one and deletes it.
   * An occupation whose name already exists there is merged into that one.
   */
  async mergeCategory(id: number, intoId: number): Promise<void> {
    if (id === intoId)
      throw new BadRequestException('Escolha outra categoria para juntar.');
    const [source, target] = await Promise.all([
      this.findCategory(id),
      this.findCategory(intoId),
    ]);

    await this.em.transactional(async (em) => {
      const [sourceOccupations, targetOccupations] = await Promise.all([
        em.find(JobOccupation, { category: source.id }),
        em.find(JobOccupation, { category: target.id }),
      ]);
      for (const occupation of sourceOccupations) {
        const twin = targetOccupations.find((o) =>
          sameName(o.name, occupation.name),
        );
        if (twin) await moveWorkersAndDelete(em, occupation.id, twin.id);
        else
          await em.execute(
            'update job_occupation set category_id = ? where id = ?',
            [target.id, occupation.id],
          );
      }
      await em.execute('delete from job_category where id = ?', [source.id]);
    });
    this.em.clear();
  }

  async deleteCategory(id: number): Promise<void> {
    await this.findCategory(id);
    const [{ workers }] = await this.em.execute(
      `select count(*) as workers from worker_job_occupations wo
        join job_occupation o on o.id = wo.job_occupation_id
        where o.category_id = ?`,
      [id],
    );
    if (Number(workers) > 0)
      throw new ConflictException(
        'Há trabalhadores com profissões desta categoria. Junte com outra categoria em vez de apagar.',
      );
    await this.em.transactional(async (em) => {
      await em.execute('delete from job_occupation where category_id = ?', [
        id,
      ]);
      await em.execute('delete from job_category where id = ?', [id]);
    });
    this.em.clear();
  }

  async createOccupation(categoryId: number, name: string): Promise<void> {
    const category = await this.findCategory(categoryId);
    const clean = tidy(name);
    await this.assertFreeOccupationName(category.id, clean);
    await this.em.persistAndFlush(new JobOccupation({ name: clean, category }));
  }

  /** Approving an occupation also approves its category, so it can show. */
  async updateOccupation(
    id: number,
    changes: { name?: string; approved?: boolean; categoryId?: number },
  ): Promise<void> {
    const occupation = await this.em.findOne(
      JobOccupation,
      { id },
      { populate: ['category'] },
    );
    if (!occupation) throw new NotFoundException('Profissão não encontrada.');

    const name =
      changes.name !== undefined ? tidy(changes.name) : occupation.name;
    const category =
      changes.categoryId !== undefined
        ? await this.findCategory(changes.categoryId)
        : (occupation.category as JobCategory);
    if (changes.name !== undefined || changes.categoryId !== undefined)
      await this.assertFreeOccupationName(category.id, name, id);

    occupation.name = name;
    occupation.category = category;
    if (changes.approved !== undefined) {
      occupation.approved = changes.approved;
      if (changes.approved) category.approved = true;
    }
    await this.em.flush();
  }

  /** Workers with the occupation get the other one instead; then it is deleted. */
  async mergeOccupation(id: number, intoId: number): Promise<void> {
    if (id === intoId)
      throw new BadRequestException('Escolha outra profissão para juntar.');
    const found = await this.em.find(JobOccupation, { id: [id, intoId] });
    if (found.length !== 2)
      throw new NotFoundException('Profissão não encontrada.');

    await this.em.transactional((em) => moveWorkersAndDelete(em, id, intoId));
    this.em.clear();
  }

  async deleteOccupation(id: number): Promise<void> {
    const [row] = await this.em.execute(
      `select count(wo.worker_id) as workers from job_occupation o
        left join worker_job_occupations wo on wo.job_occupation_id = o.id
        where o.id = ? group by o.id`,
      [id],
    );
    if (!row) throw new NotFoundException('Profissão não encontrada.');
    if (Number(row.workers) > 0)
      throw new ConflictException(
        'Há trabalhadores com esta profissão. Junte com outra profissão em vez de apagar.',
      );
    await this.em.execute('delete from job_occupation where id = ?', [id]);
    this.em.clear();
  }

  private async findCategory(id: number): Promise<JobCategory> {
    const category = await this.em.findOne(JobCategory, { id });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return category;
  }

  private async assertFreeCategoryName(name: string, exceptId?: number) {
    const all = await this.em.find(JobCategory, {});
    if (all.some((c) => c.id !== exceptId && sameName(c.name, name)))
      throw new ConflictException(
        'Já existe uma categoria com esse nome. Use "Juntar" para unir as duas.',
      );
  }

  private async assertFreeOccupationName(
    categoryId: number,
    name: string,
    exceptId?: number,
  ) {
    const all = await this.em.find(JobOccupation, { category: categoryId });
    if (all.some((o) => o.id !== exceptId && sameName(o.name, name)))
      throw new ConflictException(
        'Já existe uma profissão com esse nome nesta categoria. Use "Juntar" para unir as duas.',
      );
  }
}

async function moveWorkersAndDelete(
  em: EntityManager,
  fromId: number,
  toId: number,
) {
  // "ignore" skips workers that already have the target occupation.
  await em.execute(
    `insert ignore into worker_job_occupations (worker_id, job_occupation_id)
      select worker_id, ? from worker_job_occupations where job_occupation_id = ?`,
    [toId, fromId],
  );
  await em.execute('delete from job_occupation where id = ?', [fromId]);
}
