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
}

@Entity({ tableName: 'job_category', readonly: true })
export class JobCategory implements IJobCategory {
  @PrimaryKey()
  readonly id!: number;

  @Property()
  name!: string;

  @OneToMany(() => JobOccupation, (jobOccupation) => jobOccupation.category)
  jobOccupations = new Collection<IJobOccupation>(this);

  constructor(props: { name: string }) {
    this.name = props.name;
  }
}
