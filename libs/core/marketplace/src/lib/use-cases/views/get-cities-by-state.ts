import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EStatesCode, ICityRepository } from '@tpf/common';

export class IGetCitiesByStateResponseDTO {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  state!: string;
}
@Injectable()
export class GetCitiesByState {
  constructor(private readonly cityRepository: ICityRepository) {}

  async get(stateId: EStatesCode): Promise<IGetCitiesByStateResponseDTO[]> {
    try {
      const cities = await this.cityRepository.getByStateId(stateId);

      return cities.map((city) => ({
        id: city.id,
        name: city.name,
        state: city.state,
      }));
    } catch {
      return [];
    }
  }
}
