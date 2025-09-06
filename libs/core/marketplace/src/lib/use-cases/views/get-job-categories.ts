import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IJobCategoryRepository } from '@tpf/common';

export class IGetJobCategoriesResponseDTO {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  name!: string;
}
@Injectable()
export class GetJobCategories {
  constructor(private readonly jobRepository: IJobCategoryRepository) {}

  async get(): Promise<IGetJobCategoriesResponseDTO[]> {
    try {
      const jobCategories = await this.jobRepository.getAll();

      return jobCategories.map((jobCategory) => ({
        id: jobCategory.id,
        name: jobCategory.name,
      }));
    } catch {
      return [];
    }
  }
}
