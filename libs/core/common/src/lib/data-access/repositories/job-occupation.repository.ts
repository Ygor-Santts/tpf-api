import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { IJobCategory, IJobOccupation, JobOccupation } from '../entities';
import { Injectable } from '@nestjs/common';

export abstract class IJobOccupationRepository {
  abstract getByIds(ids: number[]): Promise<IJobOccupation[]>;
  /** Every occupation of the category, approved or still waiting for review. */
  abstract getByCategoryId(categoryId: number): Promise<IJobOccupation[]>;
  abstract getApprovedByCategoryId(
    categoryId: number,
  ): Promise<IJobOccupation[]>;
  abstract create(
    name: string,
    category: IJobCategory,
    approved?: boolean,
  ): Promise<IJobOccupation>;
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

  getApprovedByCategoryId(categoryId: number): Promise<IJobOccupation[]> {
    return this._repository.find({
      category: { id: categoryId, approved: true },
      approved: true,
    });
  }

  async create(
    name: string,
    category: IJobCategory,
    approved = true,
  ): Promise<IJobOccupation> {
    const occupation = new JobOccupation({ name, category, approved });
    await this.em.persistAndFlush(occupation);
    return occupation;
  }
}
