import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export interface IForgotPasswordDTO {
  email: string;
}

export interface IResetPasswordDTO {
  token: string;
  password: string;
}

export abstract class ForgotPasswordDTO implements IForgotPasswordDTO {
  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export abstract class ResetPasswordDTO implements IResetPasswordDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
