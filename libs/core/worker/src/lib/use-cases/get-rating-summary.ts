import { Injectable } from '@nestjs/common';
import { IRatingRepository } from '../data-access/repositories';

export abstract class IGetRatingSummary {
  abstract execute(workerId: number): Promise<{ average: number; count: number }>;
}

@Injectable()
export class GetRatingSummary implements IGetRatingSummary {
  constructor(private readonly ratingRepo: IRatingRepository) {}

  execute(workerId: number): Promise<{ average: number; count: number }> {
    return this.ratingRepo.getRatingSummary(workerId);
  }
}
