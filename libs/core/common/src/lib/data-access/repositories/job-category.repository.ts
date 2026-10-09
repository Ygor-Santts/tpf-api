import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { IJobCategory, JobCategory } from '../entities';
import { Injectable } from '@nestjs/common';

export abstract class IJobCategoryRepository {
  abstract getByIds(ids: number[]): Promise<IJobCategory[]>;
  abstract getAll(): Promise<IJobCategory[]>;
  abstract create(name: string): Promise<IJobCategory>;
}

@Injectable()
export class JobCategoryRepository implements IJobCategoryRepository {
  private _repository: EntityRepository<JobCategory>;

  constructor(private em: EntityManager) {
    this._repository = this.em.getRepository(JobCategory);
  }

  getByIds(ids: number[]): Promise<IJobCategory[]> {
    return this._repository.find({ id: { $in: ids } });
  }

  getAll(): Promise<IJobCategory[]> {
    return this._repository.findAll();
  }

  async create(name: string): Promise<IJobCategory> {
    const category = new JobCategory({ name });
    await this.em.persistAndFlush(category);
    return category;
  }
}
