import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordResetTokenRepository } from '../../data-access/repositories';
import { IResetPasswordDTO } from '../../presenter/dtos';
import { hashPasswordResetToken } from './password-reset-token';

export abstract class IResetPassword {
  abstract execute(dto: IResetPasswordDTO): Promise<void | HttpException>;
}

@Injectable()
export class ResetPassword implements IResetPassword {
  private readonly saltOrRounds = 10;

  constructor(
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
  ) {}

  async execute(dto: IResetPasswordDTO): Promise<void | HttpException> {
    const resetToken = await this.passwordResetTokenRepository.findByTokenHash(
      hashPasswordResetToken(dto.token),
    );

    if (!resetToken || !resetToken.isValid() || !resetToken.user.enabled)
      return new BadRequestException(
        'Link de redefinição inválido ou expirado. Solicite um novo.',
      );

    const passwordCrypted = await bcrypt.hash(dto.password, this.saltOrRounds);
    resetToken.user.changePassword(passwordCrypted);
    resetToken.markAsUsed();

    await this.passwordResetTokenRepository.saveWithUser(
      resetToken,
      resetToken.user,
    );
  }
}
