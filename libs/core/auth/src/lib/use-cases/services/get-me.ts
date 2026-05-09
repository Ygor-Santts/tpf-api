import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../data-access/repositories';
import { UserProfileDTO } from './login';

export abstract class IGetMe {
  abstract execute(userId: number): Promise<UserProfileDTO>;
}

@Injectable()
export class GetMe implements IGetMe {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: number): Promise<UserProfileDTO> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const isWorker = Boolean(user.worker);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isWorker,
      workerId: user.worker?.id,
    };
  }
}
