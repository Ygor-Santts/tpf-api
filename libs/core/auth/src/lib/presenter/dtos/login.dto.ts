import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export interface ILoginDTO {
  email: string;
  password: string;
}

export abstract class LoginDTO implements ILoginDTO {
  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
