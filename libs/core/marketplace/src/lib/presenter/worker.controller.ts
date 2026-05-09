import { Controller, Get, Query } from '@nestjs/common';
import { GetWorkerByParametersPaginatedDTO } from './dtos';
import {
  GetWorkersByParametersPaginated,
  IGetWorkersByParametersPaginatedResponseDTO,
} from '../use-cases/views/get-workers-by-parameters-paginated';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IGenericExceptionResponseDTO } from '@tpf/common';

@ApiTags('Workers')
@Controller('worker')
export class WorkerController {
  constructor(
    private readonly GetWorkersByParametersPaginatedView: GetWorkersByParametersPaginated,
  ) {}

  @Get('paginated')
  @ApiOperation({ summary: 'Buscar trabalhadores com filtros paginados' })
  @ApiResponse({
    status: 200,
    description: 'Get workers by parameters paginated',
    type: IGetWorkersByParametersPaginatedResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Workers not found',
    type: IGenericExceptionResponseDTO,
  })
  getWorkersByParametersPaginated(
    @Query() dto: GetWorkerByParametersPaginatedDTO,
  ) {
    return this.GetWorkersByParametersPaginatedView.get(dto);
  }
}
