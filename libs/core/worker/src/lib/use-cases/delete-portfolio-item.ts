import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IPortfolioRepository } from '../data-access/repositories';
import { unlink } from 'fs/promises';
import { join } from 'path';

export abstract class IDeletePortfolioItem {
  abstract execute(workerId: number, itemId: number): Promise<void>;
}

@Injectable()
export class DeletePortfolioItem implements IDeletePortfolioItem {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: number, itemId: number): Promise<void> {
    const item = await this.portfolioRepo.findById(itemId);
    if (!item) throw new NotFoundException('Item não encontrado');
    if ((item.worker as any).id !== workerId) throw new ForbiddenException('Acesso negado');

    const filePath = join(process.cwd(), item.url);
    await unlink(filePath).catch(() => {});

    await this.portfolioRepo.delete(item);
  }
}
