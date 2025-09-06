import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EStatesCode, EStatesName } from '@tpf/common';

export class IGetStateResponseDTO {
  @ApiProperty()
  id!: EStatesCode;
  @ApiProperty()
  name!: EStatesName;
}

@Injectable()
export class GetStates {
  constructor() {}

  async get(): Promise<IGetStateResponseDTO[]> {
    return Object.keys(EStatesCode).map((key) => ({
      id: EStatesCode[key as keyof typeof EStatesCode],
      name: EStatesName[key as keyof typeof EStatesName],
    }));
  }
}
