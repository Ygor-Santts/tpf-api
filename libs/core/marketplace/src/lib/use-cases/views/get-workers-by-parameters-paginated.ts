import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IGetWorkerByParametersPaginatedDTO } from '../../presenter/dtos';
import { IWorkerRepository } from '../../data-access/repositories';
import { IPaginationResponseDTO, PaginationResponseDTO } from '@tpf/common';
import { IWorker } from '@tpf/domain';

export class IGetWorkersByParametersResponseDTO {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  operationCities!: { id: number; name: string }[];

  @ApiProperty()
  jobCategories!: {
    id: number;
    name: string;
    occupations: { id: number; name: string }[];
  }[];

  constructor(worker: IWorker) {
    this.id = worker.id;
    this.name = worker.user.name;
    this.phone = worker.user.phone;
    this.operationCities = worker.operationCities.map((city) => ({
      id: city.id,
      name: city.name,
    }));
    this.jobCategories = worker.jobOccupations.reduce(
      (acc, occupation) => {
        const { category } = occupation;
        let categoryGroup = acc.find((cat) => cat.id === category.id);

        if (!categoryGroup) {
          categoryGroup = {
            id: category.id,
            name: category.name,
            occupations: [],
          };
          acc.push(categoryGroup);
        }

        categoryGroup.occupations.push({
          id: occupation.id,
          name: occupation.name,
        });

        return acc;
      },
      [] as {
        id: number;
        name: string;
        occupations: { id: number; name: string }[];
      }[],
    );
  }
}

export class IGetWorkersByParametersPaginatedResponseDTO extends PaginationResponseDTO<IGetWorkersByParametersResponseDTO> {
  @ApiProperty({
    type: IGetWorkersByParametersResponseDTO,
    isArray: true,
  })
  override data!: IGetWorkersByParametersResponseDTO[];
}

@Injectable()
export class GetWorkersByParametersPaginated {
  constructor(private readonly workerRepository: IWorkerRepository) {}

  async get(
    dto: IGetWorkerByParametersPaginatedDTO,
  ): Promise<
    IPaginationResponseDTO<IGetWorkersByParametersResponseDTO> | HttpException
  > {
    const { page, limit, ...parameters } = dto;

    const [workers, count] =
      await this.workerRepository.getWorkersByParametersPaginated(
        {
          ...parameters,
          page,
          limit,
        },
        [
          'user',
          'operationCities',
          'jobOccupations',
          'jobOccupations.category',
        ],
      );

    if (!workers.length) {
      return new NotFoundException(
        `Nenhum trabalhador encontrado com os parâmetros fornecidos`,
      );
    }

    const data = workers.map(
      (worker) => new IGetWorkersByParametersResponseDTO(worker),
    );

    return new PaginationResponseDTO<IGetWorkersByParametersResponseDTO>({
      data,
      pages: Math.ceil(count / limit),
      total: count,
    });
  }
}
