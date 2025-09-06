import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ICreateUserEntityDTO, IUser, IWorker, User } from '@tpf/domain';

export abstract class IUserRepository {
  abstract create(dto: ICreateUserEntityDTO): IUser;
  abstract save(user: IUser[] | IUser): Promise<void>;
  abstract saveWorkerUser(user: IUser, worker: IWorker): Promise<void>;
  abstract findUserByParams(params: Partial<IUser>): Promise<IUser | null>;
  abstract existsByParams(params: Partial<IUser>): Promise<boolean>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  entity = User;
  private _repository: EntityRepository<User>;

  constructor(private readonly em: EntityManager) {
    this._repository = this.em.getRepository(User);
  }

  create(dto: ICreateUserEntityDTO) {
    return this.entity.create(dto);
  }

  save(user: IUser[] | IUser): Promise<void> {
    return this.em.persistAndFlush(user);
  }

  saveWorkerUser(user: IUser, worker: IWorker): Promise<void> {
    return this.em.persistAndFlush([user, worker]);
  }

  findUserByParams(params: Partial<IUser>): Promise<IUser | null> {
    return this._repository.findOne(params);
  }

  async existsByParams(params: Partial<IUser>): Promise<boolean> {
    const conditions = [];

    if (params.email) conditions.push({ email: params.email });
    if (params.phone) conditions.push({ phone: params.phone });

    const user = await this.em.findOne(User, conditions);
    return !!user;
  }
}
