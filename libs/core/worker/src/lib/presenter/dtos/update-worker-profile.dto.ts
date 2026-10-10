import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsBrPhone, IsFullName, ToNumberArray } from '@tpf/common';

export class UpdateWorkerProfileDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsFullName()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBrPhone()
  phone?: string;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ToNumberArray()
  jobOccupationIds?: number[];

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ToNumberArray()
  operationCitiesIds?: number[];
}
