import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IJobOccupationRepository } from '@tpf/common';

export class IGetJobOccupationsByCategoryResponseDTO {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  name!: string;
}
@Injectable()
export class GetJobOccupationsByCategory {
  constructor(private readonly jobOccupation: IJobOccupationRepository) {}

  async get(
    categoryId: number,
  ): Promise<IGetJobOccupationsByCategoryResponseDTO[] | HttpException> {
    const jobOccupations = await this.jobOccupation.getByCategoryId(categoryId);

    if (!jobOccupations.length) {
      return new NotFoundException(`Nenhuma ocupação de trabalho encontrada`);
    }

    return jobOccupations.map((jobOccupation) => ({
      id: jobOccupation.id,
      name: jobOccupation.name,
    }));
  }
}
