import { ApiProperty } from '@nestjs/swagger';

export interface IPaginationResponseDTO<T> {
  data: T[];
  total: number;
  pages: number;
}

export class PaginationResponseDTO<T> implements IPaginationResponseDTO<T> {
  @ApiProperty()
  data!: T[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  pages!: number;

  constructor(dto: { data: T[]; total: number; pages: number }) {
    this.data = dto.data;
    this.total = dto.total;
    this.pages = dto.pages;
  }
}
