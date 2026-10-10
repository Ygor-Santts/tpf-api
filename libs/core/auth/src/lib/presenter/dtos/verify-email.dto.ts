import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export interface IVerifyEmailDTO {
  token: string;
}

export abstract class VerifyEmailDTO implements IVerifyEmailDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}
