import { Injectable, NotFoundException } from '@nestjs/common';
import { IWorkerProfileRepository } from '../data-access/repositories';

export abstract class IGetWorkerMe {
  abstract execute(workerId: number): Promise<any>;
}

@Injectable()
export class GetWorkerMe implements IGetWorkerMe {
  constructor(private readonly workerRepo: IWorkerProfileRepository) {}

  async execute(workerId: number): Promise<any> {
    const worker = await this.workerRepo.findById(workerId);
    if (!worker) throw new NotFoundException('Worker não encontrado');

    return {
      id: worker.id,
      bio: worker.bio,
      user: {
        id: worker.user.id,
        name: worker.user.name,
        email: worker.user.email,
        phone: worker.user.phone,
      },
      jobOccupations: worker.jobOccupations.map((o: any) => ({
        id: o.id,
        name: o.name,
        category: { id: o.category?.id, name: o.category?.name },
      })),
      operationCities: worker.operationCities.map((c: any) => ({
        id: c.id,
        name: c.name,
      })),
    };
  }
}
