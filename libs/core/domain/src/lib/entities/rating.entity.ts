import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { IWorker, Worker } from './worker.entity';
import { IUser, User } from './user.entity';

export abstract class IRating {
  id!: number;
  worker!: IWorker;
  author!: IUser;
  score!: number;
  comment?: string;
  createdAt!: Date;
}

@Entity({ tableName: 'rating' })
export class Rating implements IRating {
  @PrimaryKey()
  readonly id!: number;

  @ManyToOne(() => Worker, { joinColumn: 'worker_id' })
  worker!: IWorker;

  @ManyToOne(() => User, { joinColumn: 'author_id' })
  author!: IUser;

  @Property({ columnType: 'tinyint' })
  score!: number;

  @Property({ columnType: 'text', nullable: true })
  comment?: string;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onCreate: () => new Date(),
  })
  createdAt = new Date();

  constructor(props: {
    worker: IWorker;
    author: IUser;
    score: number;
    comment?: string;
  }) {
    this.worker = props.worker;
    this.author = props.author;
    this.score = props.score;
    this.comment = props.comment;
  }
}
