import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { IJobCategory, JobCategory } from './job-category.entity';

export abstract class IJobOccupation {
  abstract id: number;
  abstract name: string;
  abstract approved: boolean;
  abstract category: IJobCategory;
}

@Entity({ tableName: 'job_occupation' })
export class JobOccupation implements IJobOccupation {
  @PrimaryKey()
  readonly id!: number;

  @Property()
  name!: string;

  /** Added by a worker and not yet reviewed: hidden from the public lists. */
  @Property({ default: true })
  approved: boolean = true;

  @ManyToOne(() => JobCategory, { fieldName: 'category_id' })
  category!: IJobCategory;

  constructor(props: {
    name: string;
    category: IJobCategory;
    approved?: boolean;
  }) {
    this.name = props.name;
    this.category = props.category;
    this.approved = props.approved ?? true;
  }
}
