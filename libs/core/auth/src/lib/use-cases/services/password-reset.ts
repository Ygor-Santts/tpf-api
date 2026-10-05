import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUser } from '@tpf/domain';
import { IUserRepository } from '../../data-access/repositories';
import {
  IForgotPasswordDTO,
  IResetPasswordDTO,
} from '../../presenter/dtos/password-reset.dto';

// The token is signed with the JWT secret plus the user's current password
// hash, so it stops working as soon as the password changes. No table needed.
function resetSecret(configService: ConfigService, user: IUser) {
  return configService.get<string>('jwt.secret') + user.password;
}

export abstract class IForgotPassword {
  abstract execute(dto: IForgotPasswordDTO): Promise<void>;
}

@Injectable()
export class ForgotPassword implements IForgotPassword {
  private readonly logger = new Logger(ForgotPassword.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Always resolves, so the response never reveals which emails exist.
  async execute(dto: IForgotPasswordDTO): Promise<void> {
    const user = await this.userRepository.findUserByParams({
      email: dto.email,
    });
    if (!user || !user.enabled) return;

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      { secret: resetSecret(this.configService, user), expiresIn: '1h' },
    );

    // No email provider yet: the link goes to the log, never in production.
    if (this.configService.get<string>('env') === 'production') {
      this.logger.warn(
        `Password reset requested for user ${user.id}, but no email provider is configured.`,
      );
      return;
    }
    const appUrl = this.configService.get<string>('app.url');
    this.logger.log(
      `Password reset link for ${user.email}: ${appUrl}/reset-password?token=${token}`,
    );
  }
}

export abstract class IResetPassword {
  abstract execute(dto: IResetPasswordDTO): Promise<void | HttpException>;
}

@Injectable()
export class ResetPassword implements IResetPassword {
  private readonly saltOrRounds = 10;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: IResetPasswordDTO): Promise<void | HttpException> {
    const invalid = new BadRequestException(
      'Link de redefinição inválido ou expirado. Solicite um novo.',
    );

    const userId = this.jwtService.decode(dto.token)?.sub;
    if (typeof userId !== 'number') return invalid;

    const user = await this.userRepository.findUserById(userId);
    if (!user || !user.enabled) return invalid;

    try {
      await this.jwtService.verifyAsync(dto.token, {
        secret: resetSecret(this.configService, user),
      });
    } catch {
      return invalid;
    }

    user.password = await bcrypt.hash(dto.password, this.saltOrRounds);
    await this.userRepository.save(user);
  }
}
