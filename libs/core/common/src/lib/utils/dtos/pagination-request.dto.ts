import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export interface IPaginationDTO {
  page: number;
  limit: number;
}

export class PaginationDTO implements IPaginationDTO {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page!: number;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit!: number;
}
