import { Controller, Get, Param } from '@nestjs/common';
import { GetStates, IGetStateResponseDTO } from '../use-cases/views/get-states';
import {
  GetCitiesByState,
  IGetCitiesByStateResponseDTO,
} from '../use-cases/views/get-cities-by-state';
import { EStatesCode } from '@tpf/common';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Locales')
@Controller('locales')
export class LocalesController {
  constructor(
    private readonly getCitiesByStateView: GetCitiesByState,
    private readonly getStatesView: GetStates,
  ) {}

  @Get('state/:id/cities')
  @ApiOperation({ summary: 'Listar cidades por estado' })
  @ApiResponse({
    status: 200,
    description: 'Returns all cities by state',
    type: IGetCitiesByStateResponseDTO,
  })
  getCities(@Param('id') id: EStatesCode) {
    return this.getCitiesByStateView.get(id);
  }

  @Get('states')
  @ApiOperation({ summary: 'Listar todos os estados' })
  @ApiResponse({
    status: 200,
    description: 'Returns all states',
    type: IGetStateResponseDTO,
  })
  getStates() {
    return this.getStatesView.get();
  }
}
