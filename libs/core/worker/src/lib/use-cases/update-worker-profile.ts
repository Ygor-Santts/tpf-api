import { Injectable, NotFoundException } from '@nestjs/common';
import { IWorkerProfileRepository } from '../data-access/repositories';
import { ICityRepository, IJobOccupationRepository } from '@tpf/common';

export interface UpdateWorkerProfileInput {
  workerId: number;
  bio?: string;
  name?: string;
  phone?: string;
  jobOccupationIds?: number[];
  operationCitiesIds?: number[];
}

export abstract class IUpdateWorkerProfile {
  abstract execute(input: UpdateWorkerProfileInput): Promise<void>;
}

@Injectable()
export class UpdateWorkerProfile implements IUpdateWorkerProfile {
  constructor(
    private readonly workerRepo: IWorkerProfileRepository,
    private readonly jobOccupationRepo: IJobOccupationRepository,
    private readonly cityRepo: ICityRepository,
  ) {}

  async execute(input: UpdateWorkerProfileInput): Promise<void> {
    const { workerId, bio, name, phone, jobOccupationIds, operationCitiesIds } = input;

    const worker = await this.workerRepo.findById(workerId);
    if (!worker) throw new NotFoundException('Worker não encontrado');

    if (bio !== undefined) (worker as any).bio = bio;
    if (name !== undefined) (worker.user as any).name = name;
    if (phone !== undefined) (worker.user as any).phone = phone;

    if (jobOccupationIds !== undefined) {
      const occupations = await this.jobOccupationRepo.getByIds(jobOccupationIds);
      (worker.jobOccupations as any).set(occupations);
    }

    if (operationCitiesIds !== undefined) {
      const cities = await this.cityRepo.getByIds(operationCitiesIds);
      (worker.operationCities as any).set(cities);
    }

    await this.workerRepo.save(worker);
  }
}
