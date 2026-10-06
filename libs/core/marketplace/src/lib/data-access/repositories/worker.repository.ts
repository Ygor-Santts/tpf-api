import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/mysql';
import { IWorker, Worker } from '@tpf/domain';
import { Injectable } from '@nestjs/common';
import { GetWorkerByParametersPaginatedDTO } from '../../presenter/dtos';
import { IRelationshipAutoMap } from '@tpf/common';

const DEFAULT_RADIUS_KM = 30;
const MAX_RADIUS_KM = 100;

export abstract class IWorkerRepository {
  abstract getWorkersByParametersPaginated(
    dto: GetWorkerByParametersPaginatedDTO,
    populate?: IRelationshipAutoMap<Worker>,
  ): Promise<[IWorker[], number]>;
  abstract getRatingsByWorkerIds(
    workerIds: number[],
  ): Promise<Map<number, { average: number; count: number }>>;
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
    const { page, limit, minRating, latitude, longitude } = dto;

    let cityIds = dto.operationCitiesIds?.length
      ? dto.operationCitiesIds
      : undefined;
    if (latitude !== undefined && longitude !== undefined) {
      const nearby = await this.getNearbyCityIds(
        latitude,
        longitude,
        dto.radiusKm ?? DEFAULT_RADIUS_KM,
      );
      cityIds = cityIds ? cityIds.filter((id) => nearby.includes(id)) : nearby;
      if (!cityIds.length) return [[], 0];
    }

    let eligibleWorkerIds: number[] | undefined;
    if (minRating !== undefined) {
      const rows = await this.em.execute(
        `SELECT worker_id FROM rating GROUP BY worker_id HAVING AVG(score) >= ?`,
        [minRating],
      );
      eligibleWorkerIds = rows.map((r: any) => r.worker_id);
      if (eligibleWorkerIds.length === 0) return [[], 0];
    }

    const where = this.createWhereClause(dto, cityIds, eligibleWorkerIds);

    return this._repository.findAndCount(where, {
      limit,
      offset: (page - 1) * limit,
      populate,
      orderBy: { user: { name: 'ASC' } },
    });
  }

  async getRatingsByWorkerIds(
    workerIds: number[],
  ): Promise<Map<number, { average: number; count: number }>> {
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

  /**
   * Cities within radiusKm of the given point, plus always the closest one, so
   * someone far from their own city's center still finds its workers.
   */
  private async getNearbyCityIds(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<number[]> {
    const rows: { id: number; distance: number }[] = await this.em.execute(
      `SELECT id, 6371 * 2 * ASIN(SQRT(
          POW(SIN(RADIANS(latitude - ?) / 2), 2) +
          COS(RADIANS(?)) * COS(RADIANS(latitude)) * POW(SIN(RADIANS(longitude - ?) / 2), 2)
        )) AS distance
        FROM city
        WHERE latitude BETWEEN ? AND ?
        HAVING distance <= ?
        ORDER BY distance`,
      [
        latitude,
        latitude,
        longitude,
        latitude - 1,
        latitude + 1,
        MAX_RADIUS_KM,
      ],
    );
    return rows
      .filter((row, i) => i === 0 || row.distance <= radiusKm)
      .map((row) => Number(row.id));
  }

  private createWhereClause(
    dto: GetWorkerByParametersPaginatedDTO,
    cityIds?: number[],
    eligibleWorkerIds?: number[],
  ) {
    const whereClause: FilterQuery<IWorker> = {};

    if (dto.name) {
      whereClause.user = { name: { $like: `%${dto.name}%` } };
    }

    if (cityIds) {
      whereClause.operationCities = { id: { $in: cityIds } };
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
