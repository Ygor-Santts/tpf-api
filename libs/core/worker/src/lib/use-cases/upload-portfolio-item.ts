import { Injectable, NotFoundException } from '@nestjs/common';
import { IPortfolioRepository } from '../data-access/repositories';
import { IWorkerProfileRepository } from '../data-access/repositories';

export abstract class IUploadPortfolioItem {
  abstract execute(workerId: number, file: any, caption?: string): Promise<any>;
}

@Injectable()
export class UploadPortfolioItem implements IUploadPortfolioItem {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly workerRepo: IWorkerProfileRepository,
  ) {}

  async execute(workerId: number, file: any, caption?: string): Promise<any> {
    const worker = await this.workerRepo.findById(workerId);
    if (!worker) throw new NotFoundException('Worker não encontrado');

    const isVideo = file.mimetype?.startsWith('video/');
    const type: 'image' | 'video' = isVideo ? 'video' : 'image';
    const url = `/uploads/portfolio/${workerId}/${file.filename}`;

    const item = this.portfolioRepo.create({ worker, type, url, caption });
    await this.portfolioRepo.save(item);

    return { id: item.id, type: item.type, url: item.url, caption: item.caption, createdAt: item.createdAt };
  }
}
