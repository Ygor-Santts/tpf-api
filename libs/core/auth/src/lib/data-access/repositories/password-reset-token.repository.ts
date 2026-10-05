import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import {
  ICreatePasswordResetTokenEntityDTO,
  IPasswordResetToken,
  IUser,
  PasswordResetToken,
} from '@tpf/domain';

export abstract class IPasswordResetTokenRepository {
  abstract create(dto: ICreatePasswordResetTokenEntityDTO): IPasswordResetToken;
  abstract save(
    token: IPasswordResetToken | IPasswordResetToken[],
  ): Promise<void>;
  abstract findByTokenHash(
    tokenHash: string,
  ): Promise<IPasswordResetToken | null>;
  abstract findActiveByUser(user: IUser): Promise<IPasswordResetToken[]>;
  abstract saveWithUser(token: IPasswordResetToken, user: IUser): Promise<void>;
}

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private _repository: EntityRepository<PasswordResetToken>;

  constructor(private readonly em: EntityManager) {
    this._repository = this.em.getRepository(PasswordResetToken);
  }

  create(dto: ICreatePasswordResetTokenEntityDTO) {
    return PasswordResetToken.create(dto);
  }

  save(token: IPasswordResetToken | IPasswordResetToken[]): Promise<void> {
    return this.em.persistAndFlush(token);
  }

  findByTokenHash(tokenHash: string): Promise<IPasswordResetToken | null> {
    return this._repository.findOne(
      { tokenHash },
      { populate: ['user'] as any },
    );
  }

  findActiveByUser(user: IUser): Promise<IPasswordResetToken[]> {
    return this._repository.find({
      user: user.id,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  saveWithUser(token: IPasswordResetToken, user: IUser): Promise<void> {
    return this.em.persistAndFlush([token, user]);
  }
}
