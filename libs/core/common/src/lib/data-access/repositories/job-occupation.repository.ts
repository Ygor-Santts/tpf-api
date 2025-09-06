import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { IJobOccupation, JobOccupation } from '../entities';
import { Injectable } from '@nestjs/common';

export abstract class IJobOccupationRepository {
  abstract getByIds(ids: number[]): Promise<IJobOccupation[]>;
  abstract getByCategoryId(categoryId: number): Promise<IJobOccupation[]>;
}

@Injectable()
export class JobOccupationRepository implements IJobOccupationRepository {
  private _repository: EntityRepository<JobOccupation>;

  constructor(private em: EntityManager) {
    this._repository = this.em.getRepository(JobOccupation);
  }

  getByIds(ids: number[]): Promise<IJobOccupation[]> {
    return this._repository.find({ id: { $in: ids } });
  }

  getByCategoryId(categoryId: number): Promise<IJobOccupation[]> {
    return this._repository.find({ category: { id: categoryId } });
  }
}
