import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import * as bcrypt from 'bcrypt';
import { rmSync } from 'fs';
import { join } from 'path';
import { IUserRepository } from '../../data-access/repositories';
import { IDeleteAccountDTO } from '../../presenter/dtos';

export abstract class IDeleteAccount {
  abstract execute(userId: number, dto: IDeleteAccountDTO): Promise<void>;
}

// Deletes the account for good (store and LGPD requirement). The foreign keys
// do the rest: deleting the worker removes its occupations, cities, portfolio
// and the ratings it received; deleting the user removes the ratings it wrote.
@Injectable()
export class DeleteAccount implements IDeleteAccount {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(userId: number, dto: IDeleteAccountDTO): Promise<void> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (!bcrypt.compareSync(dto.password, user.password))
      throw new ForbiddenException('Senha incorreta.');

    await removeAccount(this.em, userId, user.worker?.id);
  }
}

/** Deletes the user, their worker profile and portfolio files. Also used by the admin area. */
export async function removeAccount(
  em: EntityManager,
  userId: number,
  workerId?: number,
): Promise<void> {
  await em.transactional(async (tx) => {
    const db = tx.getConnection();
    if (workerId) await db.execute('delete from worker where id = ?', [workerId]);
    await db.execute('delete from user where id = ?', [userId]);
  });

  if (workerId)
    rmSync(join(process.cwd(), 'uploads', 'portfolio', String(workerId)), {
      recursive: true,
      force: true,
    });
}
