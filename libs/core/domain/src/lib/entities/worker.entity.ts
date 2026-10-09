import {
  Collection,
  Entity,
  ManyToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { City, ICity, IJobOccupation, JobOccupation } from '@tpf/common';
import { IUser, User } from './user.entity';

export interface ICreateWorkerEntityDTO {
  user: IUser;
  jobOccupations?: IJobOccupation[];
  operationCities?: ICity[];
}

export abstract class IWorker {
  id!: number;
  user!: IUser;
  bio?: string;
  featuredUntil?: Date;
  jobOccupations!: Collection<IJobOccupation>;
  operationCities!: Collection<City>;
}

@Entity({ tableName: 'worker' })
export class Worker implements IWorker {
  @PrimaryKey()
  readonly id!: number;

  @OneToOne(() => User, { joinColumn: 'user_id' })
  user!: IUser;

  @Property({ nullable: true, length: 500 })
  bio?: string;

  /** Paid "Destaque": shown first in search while this date is in the future. */
  @Property({ nullable: true, fieldName: 'featured_until' })
  featuredUntil?: Date;

  @ManyToMany(() => JobOccupation, undefined, {
    pivotTable: 'worker_job_occupations',
    joinColumn: 'worker_id',
    inverseJoinColumn: 'job_occupation_id',
  })
  jobOccupations = new Collection<IJobOccupation>(this);

  @ManyToMany(() => City, undefined, {
    pivotTable: 'worker_operation_cities',
    joinColumn: 'worker_id',
    inverseJoinColumn: 'city_id',
  })
  operationCities = new Collection<ICity>(this);

  constructor(props: ICreateWorkerEntityDTO) {
    const { user, jobOccupations, operationCities } = props;
    this.user = user;
    // set() marks the items as added; passing them to new Collection() does
    // not, and the links were never saved on sign-up.
    this.jobOccupations.set(jobOccupations ?? []);
    this.operationCities.set(operationCities ?? []);
  }

  static create(props: ICreateWorkerEntityDTO): Worker {
    return new Worker(props);
  }
}

export const isFeatured = (worker: IWorker) =>
  !!worker.featuredUntil && worker.featuredUntil > new Date();
