import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { IJobCategory, JobCategory } from './job-category.entity';

export abstract class IJobOccupation {
  abstract id: number;
  abstract name: string;
  abstract category: IJobCategory;
}

@Entity({ tableName: 'job_occupation', readonly: true })
export class JobOccupation implements IJobOccupation {
  @PrimaryKey()
  readonly id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => JobCategory, { fieldName: 'category_id' })
  category!: IJobCategory;

  constructor(props: { name: string; category: IJobCategory }) {
    this.name = props.name;
    this.category = props.category;
  }
}
