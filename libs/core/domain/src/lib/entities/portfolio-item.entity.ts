import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { IWorker, Worker } from './worker.entity';

export abstract class IPortfolioItem {
  id!: number;
  worker!: IWorker;
  type!: 'image' | 'video';
  url!: string;
  caption?: string;
  createdAt!: Date;
}

@Entity({ tableName: 'portfolio_item' })
export class PortfolioItem implements IPortfolioItem {
  @PrimaryKey()
  readonly id!: number;

  @ManyToOne(() => Worker, { joinColumn: 'worker_id' })
  worker!: IWorker;

  @Property({ length: 10 })
  type!: 'image' | 'video';

  @Property({ length: 500 })
  url!: string;

  @Property({ nullable: true, length: 200 })
  caption?: string;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onCreate: () => new Date(),
  })
  createdAt = new Date();

  constructor(props: {
    worker: IWorker;
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }) {
    this.worker = props.worker;
    this.type = props.type;
    this.url = props.url;
    this.caption = props.caption;
  }
}
