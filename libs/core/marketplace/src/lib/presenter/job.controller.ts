import { Controller, Get, Param } from '@nestjs/common';
import {
  GetJobOccupationsByCategory,
  IGetJobOccupationsByCategoryResponseDTO,
} from '../use-cases/views/get-job-occupations-by-category';
import { ApiResponse } from '@nestjs/swagger';
import {
  GetJobCategories,
  IGetJobCategoriesResponseDTO,
} from '../use-cases/views/get-job-categories';
import { IGenericExceptionResponseDTO } from '@tpf/common';

@Controller('job')
export class JobController {
  constructor(
    private readonly getJobCategoriesView: GetJobCategories,
    private readonly getOccupationsByCategoryView: GetJobOccupationsByCategory,
  ) {}

  @Get('categories')
  @ApiResponse({
    status: 200,
    description: 'Returns all job categories',
    type: IGetJobCategoriesResponseDTO,
  })
  getJobCategories() {
    return this.getJobCategoriesView.get();
  }

  @Get('category/:categoryId/occupations')
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
  getOccupationsByCategory(@Param('categoryId') categoryId: number) {
    return this.getOccupationsByCategoryView.get(categoryId);
  }
}
