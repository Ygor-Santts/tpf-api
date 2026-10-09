import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { IJobCategory, JobCategory } from '../entities';
import { Injectable } from '@nestjs/common';

export abstract class IJobCategoryRepository {
  abstract getByIds(ids: number[]): Promise<IJobCategory[]>;
  /** Every category, approved or still waiting for review. */
  abstract getAll(): Promise<IJobCategory[]>;
  abstract getApproved(): Promise<IJobCategory[]>;
  abstract create(name: string, approved?: boolean): Promise<IJobCategory>;
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

  getApproved(): Promise<IJobCategory[]> {
    return this._repository.find({ approved: true });
  }

  async create(name: string, approved = true): Promise<IJobCategory> {
    const category = new JobCategory({ name, approved });
    await this.em.persistAndFlush(category);
    return category;
  }
}
