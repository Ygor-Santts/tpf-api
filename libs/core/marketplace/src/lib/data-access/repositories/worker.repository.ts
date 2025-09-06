import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/mysql';
import { IWorker, Worker } from '@tpf/domain';
import { Injectable } from '@nestjs/common';
import { GetWorkerByParametersPaginatedDTO } from '../../presenter/dtos';
import { IRelationshipAutoMap } from '@tpf/common';

export abstract class IWorkerRepository {
  abstract getWorkersByParametersPaginated(
    dto: GetWorkerByParametersPaginatedDTO,
    populate?: IRelationshipAutoMap<Worker>,
  ): Promise<[IWorker[], number]>;
}

@Injectable()
export class WorkerRepository implements IWorkerRepository {
  entity = Worker;
  private _repository: EntityRepository<Worker>;
  constructor(private readonly em: EntityManager) {
    this._repository = this.em.getRepository(Worker);
  }

  async getWorkersByParametersPaginated(
    dto: GetWorkerByParametersPaginatedDTO,
    populate?: IRelationshipAutoMap<IWorker>,
  ): Promise<[IWorker[], number]> {
    const { page, limit } = dto;

    const where = this.createWhereClause(dto);

    return this._repository.findAndCount(where, {
      limit,
      offset: (page - 1) * limit,
      populate,
      orderBy: {
        user: {
          name: 'ASC',
        },
      },
    });
  }

  private createWhereClause(dto: GetWorkerByParametersPaginatedDTO) {
    const whereClause: FilterQuery<IWorker> = {};

    if (dto.name) {
      whereClause.user = { name: { $like: `%${dto.name}%` } };
    }

    if (dto.operationCitiesIds) {
      whereClause.operationCities = { id: { $in: dto.operationCitiesIds } };
    }

    if (dto.jobOccupationIds) {
      whereClause.jobOccupations = { id: { $in: dto.jobOccupationIds } };
    }

    if (dto.jobCategoriyIds)
      whereClause.jobOccupations = {
        category: { id: { $in: dto.jobCategoriyIds } },
      };

    return whereClause;
  }
}
