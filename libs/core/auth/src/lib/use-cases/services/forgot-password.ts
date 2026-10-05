import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPasswordResetTokenRepository,
  IUserRepository,
} from '../../data-access/repositories';
import { IForgotPasswordDTO } from '../../presenter/dtos';
import { IPasswordResetNotifier } from '../../notifications/password-reset.notifier';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from './password-reset-token';

export abstract class IForgotPassword {
  abstract execute(dto: IForgotPasswordDTO): Promise<void>;
}

@Injectable()
export class ForgotPassword implements IForgotPassword {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly notifier: IPasswordResetNotifier,
    private readonly configService: ConfigService,
  ) {}

  // Sempre resolve sem erro para não revelar quais e-mails estão cadastrados.
  async execute(dto: IForgotPasswordDTO): Promise<void> {
    const user = await this.userRepository.findUserByParams({
      email: dto.email,
    });
    if (!user || !user.enabled) return;

    const activeTokens =
      await this.passwordResetTokenRepository.findActiveByUser(user);
    activeTokens.forEach((token) => token.markAsUsed());

    const token = generatePasswordResetToken();
    const expirationMinutes = this.configService.get<number>(
      'passwordReset.expirationMinutes',
    );
    const resetToken = this.passwordResetTokenRepository.create({
      user,
      tokenHash: hashPasswordResetToken(token),
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    });

    await this.passwordResetTokenRepository.save([...activeTokens, resetToken]);
    await this.notifier.notify(user, token);
  }
}
