import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IActivateWorkerDTO, IRegisterWorkerDTO } from '../../presenter/dtos';
import { IUserRepository } from '../../data-access/repositories';
import { ISendEmailVerification } from './email-verification';
import { IWorkerRepository } from '../../data-access/repositories/worker.repository';
import { ICityRepository, IJobOccupationRepository } from '@tpf/common';
import * as bcrypt from 'bcrypt';

export abstract class IRegisterWorker {
  abstract execute(dto: IRegisterWorkerDTO): Promise<void | HttpException>;
}

@Injectable()
export class RegisterWorker implements IRegisterWorker {
  private readonly saltOrRounds = 10;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly workerRepository: IWorkerRepository,
    private readonly jobOccupationRepository: IJobOccupationRepository,
    private readonly cityRepository: ICityRepository,
    private readonly sendEmailVerification: ISendEmailVerification,
  ) {}

  async execute(dto: IRegisterWorkerDTO): Promise<void | HttpException> {
    const { email, phone, password, name } = dto;

    const existUserWithSameData = await this.userRepository.existsByParams({
      email,
      phone,
    });

    if (existUserWithSameData)
      return new ConflictException('Email ou telefone já estão cadastrados');

    const refs = await findWorkerRefs(
      this.jobOccupationRepository,
      this.cityRepository,
      dto,
    );
    if (refs instanceof NotFoundException) return refs;
    const { jobOccupations, operationCities } = refs;

    const passwordCrypted = await bcrypt.hash(password, this.saltOrRounds);

    const user = this.userRepository.create({
      email,
      password: passwordCrypted,
      name,
      phone,
    });

    const worker = this.workerRepository.create({
      user,
      jobOccupations,
      operationCities,
    });

    user.setWorker(worker);

    await this.userRepository.saveWorkerUser(user, worker);
    await this.sendEmailVerification.execute(user);
  }
}

export async function findWorkerRefs(
  jobOccupationRepository: IJobOccupationRepository,
  cityRepository: ICityRepository,
  dto: IActivateWorkerDTO,
) {
  const { jobOccupationIds, operationCitiesIds } = dto;
  const [jobOccupations, operationCities] = await Promise.all([
    jobOccupationRepository.getByIds(jobOccupationIds),
    cityRepository.getByIds(operationCitiesIds),
  ]);

  const errors = [];

  if (jobOccupations.length !== jobOccupationIds.length)
    errors.push('Profissões de trabalho não encontradas');

  if (operationCities.length !== operationCitiesIds.length)
    errors.push('Cidades de operação não encontradas');

  if (errors.length) return new NotFoundException(errors.join('; '));

  return { jobOccupations, operationCities };
}
