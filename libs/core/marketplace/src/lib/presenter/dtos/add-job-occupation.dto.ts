import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

// Letters (with accents), spaces, hyphens and apostrophes: a name, not a link.
const NAME = /^[\p{L}][\p{L} '-]*$/u;
const NAME_MESSAGE = 'Use só letras, espaços e hífen.';
const Squish = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  );

export class AddJobOccupationDTO {
  @ApiProperty({ example: 'Eletricista' })
  @Squish()
  @IsString()
  @MinLength(3, { message: 'O nome precisa ter pelo menos 3 letras.' })
  @MaxLength(60, { message: 'O nome pode ter no máximo 60 letras.' })
  @Matches(NAME, { message: NAME_MESSAGE })
  name!: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiProperty({ required: false, example: 'Serviços Elétricos' })
  @IsOptional()
  @Squish()
  @IsString()
  @MinLength(3, { message: 'O nome precisa ter pelo menos 3 letras.' })
  @MaxLength(60, { message: 'O nome pode ter no máximo 60 letras.' })
  @Matches(NAME, { message: NAME_MESSAGE })
  categoryName?: string;
}
