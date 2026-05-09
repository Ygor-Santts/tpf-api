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
  abstract getRatingsByWorkerIds(workerIds: number[]): Promise<Map<number, { average: number; count: number }>>;
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
    const { page, limit, minRating } = dto;

    let eligibleWorkerIds: number[] | undefined;
    if (minRating !== undefined) {
      const rows = await this.em.execute(
        `SELECT worker_id FROM rating GROUP BY worker_id HAVING AVG(score) >= ?`,
        [minRating],
      );
      eligibleWorkerIds = rows.map((r: any) => r.worker_id);
      if (eligibleWorkerIds.length === 0) return [[], 0];
    }

    const where = this.createWhereClause(dto, eligibleWorkerIds);

    return this._repository.findAndCount(where, {
      limit,
      offset: (page - 1) * limit,
      populate,
      orderBy: { user: { name: 'ASC' } },
    });
  }

  async getRatingsByWorkerIds(workerIds: number[]): Promise<Map<number, { average: number; count: number }>> {
    const map = new Map<number, { average: number; count: number }>();
    if (!workerIds.length) return map;

    const rows = await this.em.execute(
      `SELECT worker_id, AVG(score) as average, COUNT(*) as count FROM rating WHERE worker_id IN (${workerIds.map(() => '?').join(',')}) GROUP BY worker_id`,
      workerIds,
    );
    for (const row of rows) {
      map.set(Number(row['worker_id']), {
        average: row['average'] ? Number(Number(row['average']).toFixed(1)) : 0,
        count: Number(row['count']),
      });
    }
    return map;
  }

  private createWhereClause(dto: GetWorkerByParametersPaginatedDTO, eligibleWorkerIds?: number[]) {
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

    if (eligibleWorkerIds !== undefined) {
      whereClause.id = { $in: eligibleWorkerIds };
    }

    return whereClause;
  }
}
