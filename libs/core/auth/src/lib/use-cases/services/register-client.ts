import {
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { IUserRepository } from '../../data-access/repositories';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterClientDTO {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
}

export abstract class IRegisterClient {
  abstract execute(dto: RegisterClientDTO): Promise<void | HttpException>;
}

@Injectable()
export class RegisterClient implements IRegisterClient {
  private readonly saltOrRounds = 10;

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: RegisterClientDTO): Promise<void | HttpException> {
    const { email, phone, password, name } = dto;

    const exists = await this.userRepository.existsByParams({ email, phone });
    if (exists)
      return new ConflictException('Email ou telefone já estão cadastrados');

    const passwordCrypted = await bcrypt.hash(password, this.saltOrRounds);
    const user = this.userRepository.create({ email, password: passwordCrypted, name, phone });
    await this.userRepository.save(user);
  }
}
