import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { ICity, City } from '../entities';
import { Injectable } from '@nestjs/common';
import { EStatesCode } from '../../enums';

export abstract class ICityRepository {
  abstract getByIds(ids: number[]): Promise<ICity[]>;
  abstract getByStateId(stateId: EStatesCode): Promise<ICity[]>;
}

@Injectable()
export class CityRepository implements ICityRepository {
  private _repository: EntityRepository<City>;

  constructor(private em: EntityManager) {
    this._repository = this.em.getRepository(City);
  }

  getByIds(ids: number[]): Promise<ICity[]> {
    return this._repository.find({ id: { $in: ids } });
  }

  getByStateId(stateId: EStatesCode): Promise<ICity[]> {
    return this._repository.find({ state: stateId });
  }
}
