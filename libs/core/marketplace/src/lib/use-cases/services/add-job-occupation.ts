import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IJobCategory,
  IJobCategoryRepository,
  IJobOccupationRepository,
} from '@tpf/common';

export interface IAddJobOccupationInput {
  name: string;
  categoryId?: number;
  categoryName?: string;
}

export class IAddJobOccupationResponseDTO {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  categoryId!: number;
  @ApiProperty()
  categoryName!: string;
}

export abstract class IAddJobOccupation {
  abstract execute(
    input: IAddJobOccupationInput,
  ): Promise<IAddJobOccupationResponseDTO>;
}

// "  pintor   de PAREDE " -> "Pintor de PAREDE"
const tidy = (name: string) => {
  const clean = name.trim().replace(/\s+/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

// Names match ignoring case and accents, so "Eletrica" finds "Elétrica".
const sameName = (a: string, b: string) =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0;

/**
 * A worker whose category or occupation is not in the list adds it. When the
 * name already exists, the existing one is returned instead of a copy.
 */
@Injectable()
export class AddJobOccupation implements IAddJobOccupation {
  constructor(
    private readonly categoryRepository: IJobCategoryRepository,
    private readonly occupationRepository: IJobOccupationRepository,
  ) {}

  async execute(
    input: IAddJobOccupationInput,
  ): Promise<IAddJobOccupationResponseDTO> {
    const category = await this.findOrCreateCategory(input);
    const name = tidy(input.name);

    const occupations = await this.occupationRepository.getByCategoryId(
      category.id,
    );
    const occupation =
      occupations.find((o) => sameName(o.name, name)) ??
      (await this.occupationRepository.create(name, category));

    return {
      id: occupation.id,
      name: occupation.name,
      categoryId: category.id,
      categoryName: category.name,
    };
  }

  private async findOrCreateCategory(
    input: IAddJobOccupationInput,
  ): Promise<IJobCategory> {
    if (input.categoryId) {
      const [category] = await this.categoryRepository.getByIds([
        input.categoryId,
      ]);
      if (!category) throw new NotFoundException('Categoria não encontrada.');
      return category;
    }

    if (!input.categoryName?.trim()) {
      throw new BadRequestException('Escolha ou informe uma categoria.');
    }
    const name = tidy(input.categoryName);
    const categories = await this.categoryRepository.getAll();
    return (
      categories.find((c) => sameName(c.name, name)) ??
      this.categoryRepository.create(name)
    );
  }
}
