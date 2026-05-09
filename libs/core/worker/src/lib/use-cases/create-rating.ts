import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IRatingRepository, IWorkerProfileRepository } from '../data-access/repositories';

export abstract class ICreateRating {
  abstract execute(workerId: number, authorId: number, score: number, comment?: string): Promise<any>;
}

@Injectable()
export class CreateRating implements ICreateRating {
  constructor(
    private readonly ratingRepo: IRatingRepository,
    private readonly workerRepo: IWorkerProfileRepository,
  ) {}

  async execute(workerId: number, authorId: number, score: number, comment?: string): Promise<any> {
    const worker = await this.workerRepo.findById(workerId);
    if (!worker) throw new NotFoundException('Worker não encontrado');

    if ((worker.user as any).id === authorId)
      throw new ForbiddenException('Você não pode avaliar a si mesmo');

    const existing = await this.ratingRepo.findByWorkerAndAuthor(workerId, authorId);
    if (existing) throw new ConflictException('Você já avaliou este profissional');

    const rating = this.ratingRepo.create({ worker, authorId, score, comment });
    await this.ratingRepo.save(rating);

    return { id: rating.id, score: rating.score, comment: rating.comment, createdAt: rating.createdAt };
  }
}
