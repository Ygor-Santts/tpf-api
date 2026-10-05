import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ICityRepository, IJobOccupationRepository } from '@tpf/common';
import { IActivateWorkerDTO } from '../../presenter/dtos';
import { IUserRepository } from '../../data-access/repositories';
import { IWorkerRepository } from '../../data-access/repositories/worker.repository';
import { findWorkerRefs } from './register-worker';
import { createSession, ILoginResponseDTO } from './login';

export abstract class IActivateWorker {
  abstract execute(
    userId: number,
    dto: IActivateWorkerDTO,
  ): Promise<ILoginResponseDTO>;
}

// Lets a logged-in client also become a worker. Returns a fresh session
// because the JWT carries isWorker/workerId.
@Injectable()
export class ActivateWorker implements IActivateWorker {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly workerRepository: IWorkerRepository,
    private readonly jobOccupationRepository: IJobOccupationRepository,
    private readonly cityRepository: ICityRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    userId: number,
    dto: IActivateWorkerDTO,
  ): Promise<ILoginResponseDTO> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.worker)
      throw new ConflictException('Você já tem perfil de trabalhador');

    const refs = await findWorkerRefs(
      this.jobOccupationRepository,
      this.cityRepository,
      dto,
    );
    if (refs instanceof NotFoundException) throw refs;

    const worker = this.workerRepository.create({ user, ...refs });
    user.setWorker(worker);
    await this.userRepository.saveWorkerUser(user, worker);

    return createSession(user, this.jwtService);
  }
}
