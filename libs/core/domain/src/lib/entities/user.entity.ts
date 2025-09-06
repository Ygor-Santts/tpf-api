import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { IWorker, Worker } from './worker.entity';

export interface ICreateUserEntityDTO {
  name: string;
  password: string;
  email: string;
  phone: string;
}
export abstract class IUser {
  abstract id: number;
  abstract name: string;
  abstract password: string;
  abstract email: string;
  abstract phone: string;
  abstract worker?: IWorker;
  abstract createdAt: Date;
  abstract updatedAt: Date;
  abstract lastAccess: Date;
  abstract enabled: boolean;

  abstract setWorker(worker: IWorker): void;
  abstract loggedIn(): void;
}

@Entity({ tableName: 'user' })
export class User implements IUser {
  @PrimaryKey()
  readonly id!: number;

  @Property()
  name!: string;

  @Property({ hidden: true })
  password!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ unique: true })
  phone!: string;

  // @OneToOne(() => Client, (client) => client.user, { nullable: true })
  // client?: Client;

  @OneToOne(() => Worker, { joinColumn: 'worker_id', nullable: true })
  worker?: IWorker;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onCreate: () => new Date(),
  })
  createdAt = new Date();

  @Property({
    columnType: 'timestamp',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();

  @Property({ columnType: 'timestamp', nullable: true })
  lastAccess!: Date;

  @Property({ default: true })
  enabled = true;

  constructor(props: ICreateUserEntityDTO) {
    const { name, password, email, phone } = props;
    this.name = name;
    this.password = password;
    this.email = email;
    this.phone = phone;
  }

  static create(props: ICreateUserEntityDTO): IUser {
    return new User(props);
  }

  setWorker(worker: IWorker) {
    this.worker = worker;
  }

  loggedIn() {
    this.lastAccess = new Date();
  }
}
