import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { IJobCategory, JobCategory } from '../entities';
import { Injectable } from '@nestjs/common';

export abstract class IJobCategoryRepository {
  abstract getByIds(ids: number[]): Promise<IJobCategory[]>;
  abstract getAll(): Promise<IJobCategory[]>;
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
}
