import { Injectable } from '@nestjs/common';
import { IPortfolioRepository } from '../data-access/repositories';

export abstract class IGetPortfolio {
  abstract execute(workerId: number): Promise<any[]>;
}

@Injectable()
export class GetPortfolio implements IGetPortfolio {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: number): Promise<any[]> {
    const items = await this.portfolioRepo.findByWorker(workerId);
    return items.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      caption: item.caption,
      createdAt: item.createdAt,
    }));
  }
}
