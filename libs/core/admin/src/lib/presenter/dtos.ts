import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { AdminUserFilter } from '../services/admin-users.service';

// Same rule as when a worker adds one: letters, spaces, hyphen, apostrophe.
const NAME = /^[\p{L}][\p{L} '-]*$/u;
const Squish = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  );

export class AdminNameDTO {
  @ApiProperty({ example: 'Pedreiro' })
  @Squish()
  @IsString()
  @MinLength(3, { message: 'O nome precisa ter pelo menos 3 letras.' })
  @MaxLength(60, { message: 'O nome pode ter no máximo 60 letras.' })
  @Matches(NAME, { message: 'Use só letras, espaços e hífen.' })
  name!: string;
}

export class UpdateCategoryDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Squish()
  @IsString()
  @MinLength(3, { message: 'O nome precisa ter pelo menos 3 letras.' })
  @MaxLength(60, { message: 'O nome pode ter no máximo 60 letras.' })
  @Matches(NAME, { message: 'Use só letras, espaços e hífen.' })
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}

export class UpdateOccupationDTO extends UpdateCategoryDTO {
  @ApiProperty({ required: false, description: 'Move to another category' })
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;
}

export class MergeDTO {
  @ApiProperty({ description: 'Id of the one that stays' })
  @IsInt()
  @Min(1)
  intoId!: number;
}

export class SetEnabledDTO {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}

export class ListUsersDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiProperty({
    required: false,
    enum: ['all', 'workers', 'clients', 'disabled'],
  })
  @IsOptional()
  @IsIn(['all', 'workers', 'clients', 'disabled'])
  filter?: AdminUserFilter;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
