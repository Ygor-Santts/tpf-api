import { Injectable } from '@nestjs/common';
import { IRatingRepository } from '../data-access/repositories';

export abstract class IGetRatings {
  abstract execute(workerId: number, page: number, limit: number): Promise<any>;
}

@Injectable()
export class GetRatings implements IGetRatings {
  constructor(private readonly ratingRepo: IRatingRepository) {}

  async execute(workerId: number, page: number, limit: number): Promise<any> {
    const [ratings, total] = await this.ratingRepo.findByWorker(workerId, page, limit);
    return {
      data: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        authorName: (r.author as any)?.name,
      })),
      total,
      page,
      limit,
    };
  }
}
