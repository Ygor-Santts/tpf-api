import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../data-access/repositories';
import { ILoginDTO } from '../../presenter/dtos/login.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ILoginResponseDTO {
  @ApiProperty()
  access_token: string;
}

export abstract class ILogin {
  abstract execute(
    dto: ILoginDTO,
  ): Promise<{ access_token: string } | HttpException>;
}

@Injectable()
export class Login implements ILogin {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    dto: ILoginDTO,
  ): Promise<{ access_token: string } | HttpException> {
    const { email, password } = dto;
    const user = await this.userRepository.findUserByParams({
      email,
    });

    if (!user)
      return new NotFoundException(
        'Dados incorretos. Verifique os dados e tente novamente.',
      );

    const matchPassword = bcrypt.compareSync(password, user.password);
    if (!matchPassword)
      return new NotFoundException(
        'Dados incorretos. Verifique os dados e tente novamente.',
      );

    user.loggedIn();

    await this.userRepository.save(user);

    return {
      access_token: await this.jwtService.signAsync({ email }),
    };
  }
}
