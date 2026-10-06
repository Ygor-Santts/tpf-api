import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/mysql';
import { IWorker, Worker } from '@tpf/domain';
import { Injectable } from '@nestjs/common';
import { GetWorkerByParametersPaginatedDTO } from '../../presenter/dtos';
import { IRelationshipAutoMap } from '@tpf/common';

const DEFAULT_RADIUS_KM = 30;
const MAX_RADIUS_KM = 100;
/** "Melhores no ramo" only ranks workers with at least this many reviews. */
const MIN_RATINGS_FOR_BEST = 3;

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

    const best = dto.sort === 'best';
    let eligibleWorkerIds: number[] | undefined;
    if (minRating !== undefined || best) {
      const rows = await this.em.execute(
        `SELECT worker_id FROM rating GROUP BY worker_id HAVING AVG(score) >= ? AND COUNT(*) >= ?`,
        [minRating ?? 0, best ? MIN_RATINGS_FOR_BEST : 1],
      );
      eligibleWorkerIds = rows.map((r: any) => r.worker_id);
      if (eligibleWorkerIds.length === 0) return [[], 0];
    }

    const where = this.createWhereClause(dto, cityIds, eligibleWorkerIds);
    const matching = await this._repository.find(where, { fields: ['id'] });
    if (!matching.length) return [[], 0];

    const pageIds = await this.getOrderedPage(
      matching.map((w) => w.id),
      best,
      limit,
      (page - 1) * limit,
    );
    const workers = pageIds.length
      ? await this._repository.find({ id: { $in: pageIds } }, { populate })
      : [];
    workers.sort((a, b) => pageIds.indexOf(a.id) - pageIds.indexOf(b.id));
    return [workers, matching.length];
  }

  /**
   * One page of worker ids in display order. By default, workers with an
   * active Destaque come first (best rated first among them), then everyone
   * else by name. "best" ranks by rating only; Destaque does not count there.
   */
  private async getOrderedPage(
    workerIds: number[],
    best: boolean,
    limit: number,
    offset: number,
  ): Promise<number[]> {
    const featured = `(w.featured_until IS NOT NULL AND w.featured_until > NOW())`;
    const orderBy = best
      ? `r.average DESC, r.total DESC, u.name ASC`
      : `${featured} DESC, IF(${featured}, COALESCE(r.average, 0), 0) DESC, u.name ASC`;
    const rows = await this.em.execute(
      `SELECT w.id FROM worker w
        JOIN user u ON u.id = w.user_id
        LEFT JOIN (
          SELECT worker_id, AVG(score) AS average, COUNT(*) AS total
          FROM rating GROUP BY worker_id
        ) r ON r.worker_id = w.id
        WHERE w.id IN (${workerIds.map(() => '?').join(',')})
        ORDER BY ${orderBy}, w.id
        LIMIT ? OFFSET ?`,
      [...workerIds, limit, offset],
    );
    return rows.map((row: any) => Number(row.id));
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
