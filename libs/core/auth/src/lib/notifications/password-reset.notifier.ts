import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUser } from '@tpf/domain';

export abstract class IPasswordResetNotifier {
  abstract notify(user: IUser, token: string): Promise<void>;
}

/**
 * Até existir um provedor de e-mail, o link de redefinição é apenas
 * registrado no log fora de produção. Em produção o token nunca é logado.
 */
@Injectable()
export class LogPasswordResetNotifier implements IPasswordResetNotifier {
  private readonly logger = new Logger(LogPasswordResetNotifier.name);

  constructor(private readonly configService: ConfigService) {}

  async notify(user: IUser, token: string): Promise<void> {
    if (this.configService.get<string>('env') === 'production') {
      this.logger.warn(
        `Redefinição de senha solicitada para o usuário ${user.id}, mas nenhum provedor de e-mail está configurado.`,
      );
      return;
    }

    const appUrl = this.configService.get<string>('app.url');
    const link = `${appUrl}/reset-password?token=${token}`;
    this.logger.log(`Link de redefinição de senha para ${user.email}: ${link}`);
  }
}
