import { ApiProperty } from '@nestjs/swagger';
import { IPaginationDTO, PaginationDTO, ToNumberArray } from '@tpf/common';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export interface IGetWorkerByParametersPaginatedDTO extends IPaginationDTO {
  name?: string;
  operationCitiesIds?: number[];
  jobOccupationIds?: number[];
  jobCategoriyIds?: number[];
}

export class GetWorkerByParametersPaginatedDTO extends PaginationDTO {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: [1], required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ToNumberArray()
  jobOccupationIds?: number[];

  @ApiProperty({ example: [1], required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ToNumberArray()
  operationCitiesIds?: number[];

  @ApiProperty({ example: [1], required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ToNumberArray()
  jobCategoriyIds?: number[];
}
