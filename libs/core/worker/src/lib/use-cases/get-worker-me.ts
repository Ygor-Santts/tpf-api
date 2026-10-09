import { Injectable, NotFoundException } from '@nestjs/common';
import { isFeatured } from '@tpf/domain';
import { IWorkerProfileRepository } from '../data-access/repositories';

export abstract class IGetWorkerMe {
  /**
   * With `publicView`, a deactivated account is not found and occupations
   * still waiting for review are left out.
   */
  abstract execute(workerId: number, publicView?: boolean): Promise<any>;
}

@Injectable()
export class GetWorkerMe implements IGetWorkerMe {
  constructor(private readonly workerRepo: IWorkerProfileRepository) {}

  async execute(workerId: number, publicView = false): Promise<any> {
    const worker = await this.workerRepo.findById(workerId);
    if (!worker || (publicView && !worker.user.enabled))
      throw new NotFoundException('Worker não encontrado');

    const occupations = worker.jobOccupations
      .getItems()
      .filter((o) => !publicView || (o.approved && o.category?.approved));

    return {
      id: worker.id,
      bio: worker.bio,
      featuredUntil: isFeatured(worker) ? worker.featuredUntil : null,
      user: {
        id: worker.user.id,
        name: worker.user.name,
        phone: worker.user.phone,
      },
      jobOccupations: occupations.map((o: any) => ({
        id: o.id,
        name: o.name,
        pending: !o.approved || !o.category?.approved,
        category: { id: o.category?.id, name: o.category?.name },
      })),
      operationCities: worker.operationCities.map((c: any) => ({
        id: c.id,
        name: c.name,
      })),
    };
  }
}
