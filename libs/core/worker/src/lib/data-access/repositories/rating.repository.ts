import { EntityRepository } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { IRating, Rating, User } from '@tpf/domain';

export abstract class IRatingRepository {
  abstract findByWorker(workerId: number, page: number, limit: number): Promise<[IRating[], number]>;
  abstract findByWorkerAndAuthor(workerId: number, authorId: number): Promise<IRating | null>;
  abstract getRatingSummary(workerId: number): Promise<{ average: number; count: number }>;
  abstract save(rating: IRating): Promise<void>;
  abstract create(props: { worker: any; authorId: number; score: number; comment?: string }): IRating;
}

@Injectable()
export class RatingRepository implements IRatingRepository {
  private _repository: EntityRepository<Rating>;

  constructor(private readonly em: EntityManager) {
    this._repository = this.em.getRepository(Rating);
  }

  create(props: { worker: any; authorId: number; score: number; comment?: string }): IRating {
    const author = this.em.getReference(User, props.authorId);
    return new Rating({ worker: props.worker, author, score: props.score, comment: props.comment });
  }

  findByWorker(workerId: number, page: number, limit: number): Promise<[IRating[], number]> {
    return this._repository.findAndCount(
      { worker: { id: workerId } },
      {
        populate: ['author'] as any,
        orderBy: { createdAt: 'DESC' },
        limit,
        offset: (page - 1) * limit,
      },
    );
  }

  findByWorkerAndAuthor(workerId: number, authorId: number): Promise<IRating | null> {
    return this._repository.findOne({ worker: { id: workerId }, author: { id: authorId } });
  }

  async getRatingSummary(workerId: number): Promise<{ average: number; count: number }> {
    const result = await this.em.execute(
      `SELECT AVG(score) as average, COUNT(*) as count FROM rating WHERE worker_id = ?`,
      [workerId],
    );
    const row = result[0] ?? { average: null, count: 0 };
    return {
      average: row.average ? Number(Number(row.average).toFixed(1)) : 0,
      count: Number(row.count),
    };
  }

  save(rating: IRating): Promise<void> {
    return this.em.persistAndFlush(rating);
  }
}
