import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IWorker, Worker } from '@tpf/domain';

export abstract class IWorkerProfileRepository {
  abstract findById(id: number): Promise<IWorker | null>;
  abstract save(worker: IWorker): Promise<void>;
}

@Injectable()
export class WorkerProfileRepository implements IWorkerProfileRepository {
  private _repository: EntityRepository<Worker>;

  constructor(private readonly em: EntityManager) {
    this._repository = this.em.getRepository(Worker);
  }

  findById(id: number): Promise<IWorker | null> {
    return this._repository.findOne(
      { id },
      { populate: ['user', 'jobOccupations', 'jobOccupations.category', 'operationCities'] as any },
    );
  }

  save(worker: IWorker): Promise<void> {
    return this.em.persistAndFlush(worker);
  }
}
