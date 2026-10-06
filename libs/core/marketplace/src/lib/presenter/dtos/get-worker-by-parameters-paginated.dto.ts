import { ApiProperty } from '@nestjs/swagger';
import { IPaginationDTO, PaginationDTO, ToNumberArray } from '@tpf/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export interface IGetWorkerByParametersPaginatedDTO extends IPaginationDTO {
  name?: string;
  operationCitiesIds?: number[];
  jobOccupationIds?: number[];
  jobCategoriyIds?: number[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
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

  @ApiProperty({ example: 4, required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minRating?: number;

  @ApiProperty({
    example: -18.9141,
    required: false,
    description:
      'Client position. With longitude, only workers serving cities within radiusKm are returned. Never stored.',
  })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ example: -48.2749, required: false })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    example: 30,
    required: false,
    minimum: 1,
    maximum: 100,
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  radiusKm?: number;
}
