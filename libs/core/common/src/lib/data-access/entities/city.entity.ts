import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

export abstract class ICity {
  abstract id: number;
  abstract name: string;
  abstract state: string;
}

@Entity({ tableName: 'city', readonly: true })
export class City implements ICity {
  @PrimaryKey()
  readonly id!: number;

  @Property()
  name!: string;

  @Property()
  state!: string;

  @Property({ fieldName: 'ibge_id', nullable: true, unique: true })
  ibgeId?: number;

  @Property({ type: 'double', nullable: true })
  latitude?: number;

  @Property({ type: 'double', nullable: true })
  longitude?: number;

  constructor(props: { name: string; state: string }) {
    this.name = props.name;
    this.state = props.state;
  }
}
