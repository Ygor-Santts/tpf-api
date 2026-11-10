import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  GetJobOccupationsByCategory,
  IGetJobOccupationsByCategoryResponseDTO,
} from '../use-cases/views/get-job-occupations-by-category';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  GetJobCategories,
  IGetJobCategoriesResponseDTO,
} from '../use-cases/views/get-job-categories';
import {
  IGenericExceptionResponseDTO,
  RateLimit,
  RateLimitGuard,
} from '@tpf/common';
import {
  IAddJobOccupation,
  IAddJobOccupationResponseDTO,
} from '../use-cases/services/add-job-occupation';
import { AddJobOccupationDTO } from './dtos';

@ApiTags('Jobs')
@Controller('job')
export class JobController {
  constructor(
    private readonly getJobCategoriesView: GetJobCategories,
    private readonly getOccupationsByCategoryView: GetJobOccupationsByCategory,
    private readonly addJobOccupation: IAddJobOccupation,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas as categorias de trabalho' })
  @ApiResponse({
    status: 200,
    description: 'Returns all job categories',
    type: IGetJobCategoriesResponseDTO,
  })
  getJobCategories() {
    return this.getJobCategoriesView.get();
  }

  @Get('category/:categoryId/occupations')
  @ApiOperation({ summary: 'Listar ocupações por categoria' })
  @ApiResponse({
    status: 200,
    description: 'Returns all occupations by category',
    type: IGetJobOccupationsByCategoryResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Occupations not found',
    type: IGenericExceptionResponseDTO,
  })
  getOccupationsByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.getOccupationsByCategoryView.get(categoryId);
  }

  // Public on purpose: a new worker picks their occupations before the account
  // exists, during sign-up. Limited per address, so nobody floods the admin's
  // review list.
  @Post('occupations')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    name: 'add-occupation',
    limit: 20,
    windowMs: 60 * 60 * 1000,
    message: 'Muitas profissões adicionadas. Tente de novo mais tarde.',
  })
  @ApiOperation({
    summary: 'Adicionar uma ocupação (e, se preciso, uma nova categoria)',
  })
  @ApiResponse({
    status: 201,
    description: 'The new occupation, or the existing one with the same name',
    type: IAddJobOccupationResponseDTO,
  })
  @ApiResponse({ status: 429, type: IGenericExceptionResponseDTO })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: IGenericExceptionResponseDTO,
  })
  addOccupation(@Body() body: AddJobOccupationDTO) {
    return this.addJobOccupation.execute(body);
  }
}
