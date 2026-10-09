import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { GetWorkerByParametersPaginatedDTO } from './dtos';
import {
  GetWorkersByParametersPaginated,
  IGetWorkersByParametersPaginatedResponseDTO,
} from '../use-cases/views/get-workers-by-parameters-paginated';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IGenericExceptionResponseDTO } from '@tpf/common';
import { OptionalJwtAuthGuard } from '@tpf/auth';

@ApiTags('Workers')
@Controller('worker')
export class WorkerController {
  constructor(
    private readonly GetWorkersByParametersPaginatedView: GetWorkersByParametersPaginated,
  ) {}

  // Public, so visitors can browse; the phone is only sent to signed-in users.
  @Get('paginated')
  @UseGuards(OptionalJwtAuthGuard)
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
    @Request() req: any,
  ) {
    return this.GetWorkersByParametersPaginatedView.get(dto, Boolean(req.user));
  }
}
