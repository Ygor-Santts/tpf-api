import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { IUser, User } from './user.entity';

export interface ICreatePasswordResetTokenEntityDTO {
  user: IUser;
  tokenHash: string;
  expiresAt: Date;
}

export abstract class IPasswordResetToken {
  abstract id: number;
  abstract user: IUser;
  abstract tokenHash: string;
  abstract expiresAt: Date;
  abstract usedAt?: Date;
  abstract createdAt: Date;

  abstract isValid(now?: Date): boolean;
  abstract markAsUsed(): void;
}

@Entity({ tableName: 'password_reset_token' })
export class PasswordResetToken implements IPasswordResetToken {
  @PrimaryKey()
  readonly id!: number;

  @ManyToOne(() => User, { joinColumn: 'user_id' })
  user!: IUser;

  @Property({ columnType: 'char(64)', unique: true, hidden: true })
  tokenHash!: string;

  @Property({ columnType: 'timestamp' })
  expiresAt!: Date;

  @Property({ columnType: 'timestamp', nullable: true })
  usedAt?: Date;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onCreate: () => new Date(),
  })
  createdAt = new Date();

  constructor(props: ICreatePasswordResetTokenEntityDTO) {
    this.user = props.user;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
  }

  static create(
    props: ICreatePasswordResetTokenEntityDTO,
  ): IPasswordResetToken {
    return new PasswordResetToken(props);
  }

  isValid(now = new Date()): boolean {
    return !this.usedAt && this.expiresAt.getTime() > now.getTime();
  }

  markAsUsed() {
    this.usedAt = new Date();
  }
}
