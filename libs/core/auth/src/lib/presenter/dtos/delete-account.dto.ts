import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export interface IDeleteAccountDTO {
  password: string;
}

export abstract class DeleteAccountDTO implements IDeleteAccountDTO {
  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
