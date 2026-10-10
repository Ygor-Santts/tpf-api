import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '@tpf/domain';
import { IUserRepository } from '../../data-access/repositories';
import { IVerifyEmailDTO } from '../../presenter/dtos/verify-email.dto';
import { IMailer } from './mailer';

// The token is signed with the JWT secret plus the user's email, so a link
// sent to an old address stops working if the email changes. No table needed.
function verifySecret(configService: ConfigService, user: IUser) {
  return `${configService.get<string>('jwt.secret')}:verify:${user.email}`;
}

// Sends the link that confirms the person owns their email.
export abstract class ISendEmailVerification {
  abstract execute(user: IUser): Promise<void>;
}

@Injectable()
export class SendEmailVerification implements ISendEmailVerification {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailer: IMailer,
  ) {}

  async execute(user: IUser): Promise<void> {
    if (user.emailVerified) return;

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      { secret: verifySecret(this.configService, user), expiresIn: '7d' },
    );
    const appUrl = this.configService.get<string>('app.url');
    const link = `${appUrl}/verify-email?token=${token}`;
    const firstName = user.name.split(' ')[0];

    this.mailer.send({
      to: user.email,
      link,
      subject: 'Confirme seu e-mail no Trampo Fácil',
      text:
        `Olá, ${firstName}!\n\nPara confirmar que este e-mail é seu, abra o link abaixo (ele vale por 7 dias):\n\n${link}\n\n` +
        `Se você não criou uma conta no Trampo Fácil, pode ignorar este e-mail.`,
      html:
        `<p>Olá, ${escapeHtml(firstName)}!</p><p>Para confirmar que este e-mail é seu, clique no link abaixo:</p>` +
        `<p><a href="${link}">Confirmar meu e-mail</a></p>` +
        `<p>O link vale por 7 dias. Se você não criou uma conta no Trampo Fácil, pode ignorar este e-mail.</p>`,
    });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// Sends the link again for the signed-in user, at most once a minute.
export abstract class IResendEmailVerification {
  abstract execute(userId: number): Promise<void | HttpException>;
}

@Injectable()
export class ResendEmailVerification implements IResendEmailVerification {
  private readonly lastSent = new Map<number, number>();

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sendEmailVerification: ISendEmailVerification,
  ) {}

  async execute(userId: number): Promise<void | HttpException> {
    const now = Date.now();
    if (now - (this.lastSent.get(userId) ?? 0) < 60_000)
      return new BadRequestException(
        'Já enviamos um link há pouco. Aguarde um minuto para pedir outro.',
      );

    const user = await this.userRepository.findUserById(userId);
    if (!user || user.emailVerified) return;

    this.lastSent.set(userId, now);
    await this.sendEmailVerification.execute(user);
  }
}

// Marks the email as confirmed from the link.
export abstract class IVerifyEmail {
  abstract execute(dto: IVerifyEmailDTO): Promise<void | HttpException>;
}

@Injectable()
export class VerifyEmail implements IVerifyEmail {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: IVerifyEmailDTO): Promise<void | HttpException> {
    const invalid = new BadRequestException(
      'Link de confirmação inválido ou expirado. Peça um novo no app.',
    );

    const userId = this.jwtService.decode(dto.token)?.sub;
    if (typeof userId !== 'number') return invalid;

    const user = await this.userRepository.findUserById(userId);
    if (!user || !user.enabled) return invalid;
    if (user.emailVerified) return;

    try {
      await this.jwtService.verifyAsync(dto.token, {
        secret: verifySecret(this.configService, user),
      });
    } catch {
      return invalid;
    }

    user.emailVerified = true;
    await this.userRepository.save(user);
  }
}
