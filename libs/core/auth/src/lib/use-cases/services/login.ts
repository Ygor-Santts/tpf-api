import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../data-access/repositories';
import { ILoginDTO } from '../../presenter/dtos/login.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IUser } from '@tpf/domain';
import { RateLimiter } from '@tpf/common';

// Compared when the email has no account, so the answer takes as long as
// for a real one and does not tell which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

// Wrong passwords allowed per email before it waits 15 minutes.
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

export class UserProfileDTO {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() phone: string;
  @ApiProperty() isWorker: boolean;
  @ApiProperty({ required: false }) workerId?: number;
  @ApiProperty() isAdmin: boolean;
}

export class ILoginResponseDTO {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: UserProfileDTO })
  user: UserProfileDTO;
}

export abstract class ILogin {
  abstract execute(dto: ILoginDTO): Promise<ILoginResponseDTO | HttpException>;
}

@Injectable()
export class Login implements ILogin {
  private readonly failures = new RateLimiter(MAX_FAILURES, FAILURE_WINDOW_MS);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: ILoginDTO): Promise<ILoginResponseDTO | HttpException> {
    const { email, password } = dto;
    const key = email.trim().toLowerCase();
    if (!this.failures.allows(key))
      return new HttpException(
        'Muitas tentativas com senha errada. Aguarde 15 minutos ou use "Esqueci minha senha".',
        HttpStatus.TOO_MANY_REQUESTS,
      );

    const user = await this.userRepository.findUserWithWorker(email);
    const matchPassword = await bcrypt.compare(
      password,
      user?.password ?? DUMMY_HASH,
    );
    if (!user || !matchPassword) {
      this.failures.hit(key);
      return new NotFoundException(
        'Dados incorretos. Verifique os dados e tente novamente.',
      );
    }
    this.failures.reset(key);

    if (!user.enabled)
      return new ForbiddenException('Esta conta está desativada.');

    user.loggedIn();
    await this.userRepository.save(user);

    return createSession(user, this.jwtService);
  }
}

export async function createSession(
  user: IUser,
  jwtService: JwtService,
): Promise<ILoginResponseDTO> {
  const isWorker = Boolean(user.worker);
  const workerId = user.worker?.id;

  const access_token = await jwtService.signAsync({
    email: user.email,
    userId: user.id,
    isWorker,
    workerId,
    tokenVersion: user.tokenVersion,
  });

  return {
    access_token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phone: user.phone,
      isWorker,
      workerId,
      isAdmin: user.isAdmin,
    },
  };
}
