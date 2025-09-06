import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { ICreateWorkerEntityDTO, IWorker, Worker } from '@tpf/domain';

export abstract class IWorkerRepository {
  abstract create(dto: ICreateWorkerEntityDTO): IWorker;
  abstract save(worker: IWorker[]): Promise<void>;
}

@Injectable()
export class WorkerRepository implements IWorkerRepository {
  entity = Worker;
  private _repository: EntityRepository<Worker>;

  constructor(private readonly em: EntityManager) {
    this._repository = this.em.getRepository(Worker);
  }

  create(dto: ICreateWorkerEntityDTO): IWorker {
    return this.entity.create(dto);
  }

  save(worker: IWorker[]): Promise<void> {
    return this.em.persistAndFlush(worker);
  }
}
