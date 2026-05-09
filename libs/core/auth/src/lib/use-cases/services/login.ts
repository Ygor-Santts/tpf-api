import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../data-access/repositories';
import { ILoginDTO } from '../../presenter/dtos/login.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDTO {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() phone: string;
  @ApiProperty() isWorker: boolean;
  @ApiProperty({ required: false }) workerId?: number;
}

export class ILoginResponseDTO {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: UserProfileDTO })
  user: UserProfileDTO;
}

export abstract class ILogin {
  abstract execute(
    dto: ILoginDTO,
  ): Promise<ILoginResponseDTO | HttpException>;
}

@Injectable()
export class Login implements ILogin {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: ILoginDTO): Promise<ILoginResponseDTO | HttpException> {
    const { email, password } = dto;
    const user = await this.userRepository.findUserWithWorker(email);

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

    const isWorker = Boolean(user.worker);
    const workerId = user.worker?.id;

    const access_token = await this.jwtService.signAsync({
      email,
      userId: user.id,
      isWorker,
      workerId,
    });

    return {
      access_token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isWorker, workerId },
    };
  }
}
