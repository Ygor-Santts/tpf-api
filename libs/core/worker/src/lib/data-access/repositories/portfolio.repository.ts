import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IPortfolioItem, PortfolioItem } from '@tpf/domain';

export abstract class IPortfolioRepository {
  abstract findByWorker(workerId: number): Promise<IPortfolioItem[]>;
  abstract findById(id: number): Promise<IPortfolioItem | null>;
  abstract save(item: IPortfolioItem): Promise<void>;
  abstract delete(item: IPortfolioItem): Promise<void>;
  abstract create(props: { worker: any; type: 'image' | 'video'; url: string; caption?: string }): IPortfolioItem;
}

@Injectable()
export class PortfolioRepository implements IPortfolioRepository {
  private _repository: EntityRepository<PortfolioItem>;

  constructor(private readonly em: EntityManager) {
    this._repository = this.em.getRepository(PortfolioItem);
  }

  create(props: { worker: any; type: 'image' | 'video'; url: string; caption?: string }): IPortfolioItem {
    return new PortfolioItem(props);
  }

  findByWorker(workerId: number): Promise<IPortfolioItem[]> {
    return this._repository.find({ worker: { id: workerId } });
  }

  findById(id: number): Promise<IPortfolioItem | null> {
    return this._repository.findOne({ id }, { populate: ['worker'] as any });
  }

  save(item: IPortfolioItem): Promise<void> {
    return this.em.persistAndFlush(item);
  }

  delete(item: IPortfolioItem): Promise<void> {
    return this.em.removeAndFlush(item);
  }
}
