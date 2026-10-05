import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEmail,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  IsPhoneNumber,
} from 'class-validator';

export interface IActivateWorkerDTO {
  jobOccupationIds: number[];
  operationCitiesIds: number[];
}

export interface IRegisterWorkerDTO extends IActivateWorkerDTO {
  name: string;
  password: string;
  email: string;
  phone: string;
}

export class ActivateWorkerDTO implements IActivateWorkerDTO {
  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  jobOccupationIds!: number[];

  @ApiProperty({ example: [7, 8, 9] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  operationCitiesIds!: number[];
}

export class RegisterWorkerDTO
  extends ActivateWorkerDTO
  implements IRegisterWorkerDTO
{
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '5511999999999' })
  @IsPhoneNumber('BR')
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
