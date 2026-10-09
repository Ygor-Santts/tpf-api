import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { IJobOccupation, JobOccupation } from './job-occupation.entity';

export abstract class IJobCategory {
  abstract id: number;
  abstract name: string;
  abstract approved: boolean;
}

@Entity({ tableName: 'job_category' })
export class JobCategory implements IJobCategory {
  @PrimaryKey()
  readonly id!: number;

  @Property()
  name!: string;

  /** Added by a worker and not yet reviewed: hidden from the public lists. */
  @Property({ default: true })
  approved: boolean = true;

  @OneToMany(() => JobOccupation, (jobOccupation) => jobOccupation.category)
  jobOccupations = new Collection<IJobOccupation>(this);

  constructor(props: { name: string; approved?: boolean }) {
    this.name = props.name;
    this.approved = props.approved ?? true;
  }
}
