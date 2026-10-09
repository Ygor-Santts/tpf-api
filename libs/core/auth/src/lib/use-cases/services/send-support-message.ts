import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ISupportMessageDTO,
  SUPPORT_TOPICS,
} from '../../presenter/dtos/support.dto';

// Who sent the message, when the person was signed in.
export interface ISupportSender {
  userId: number;
  isWorker: boolean;
}

export abstract class ISendSupportMessage {
  abstract execute(
    dto: ISupportMessageDTO,
    ip: string,
    sender?: ISupportSender,
  ): Promise<void>;
}

// The form is open to visitors, so each address may send only a few
// messages per hour. Kept in memory: a restart just resets the count.
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

@Injectable()
export class SendSupportMessage implements ISendSupportMessage {
  private readonly logger = new Logger(SendSupportMessage.name);
  private readonly sent = new Map<string, number[]>();

  constructor(private readonly configService: ConfigService) {}

  async execute(
    dto: ISupportMessageDTO,
    ip: string,
    sender?: ISupportSender,
  ): Promise<void> {
    this.checkLimit(ip);

    const topic = SUPPORT_TOPICS[dto.topic];
    const who = sender
      ? `Usuário #${sender.userId} (${sender.isWorker ? 'trabalhador' : 'cliente'})`
      : 'Visitante (não entrou na conta)';
    const subject = `[Suporte] ${topic}: ${dto.name.trim()}`;
    const text =
      `Nome: ${dto.name.trim()}\nE-mail: ${dto.email.trim()}\n` +
      `Assunto: ${topic}\nConta: ${who}\n\n${dto.message.trim()}\n\n` +
      `Responda este e-mail para falar direto com a pessoa.`;

    const apiKey = this.configService.get<string>('mail.resendApiKey');
    const to = this.configService.get<string>('mail.supportTo');
    if (!apiKey || !to) {
      if (this.configService.get<string>('env') === 'production') {
        this.logger.warn(
          'Support message received, but RESEND_API_KEY or SUPPORT_EMAIL is not set.',
        );
        throw new ServiceUnavailableException(
          'Não foi possível enviar sua mensagem agora. Tente de novo mais tarde.',
        );
      }
      this.logger.log(`Support message (not sent, no email set up):\n${text}`);
      return;
    }

    let res: Response;
    try {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.configService.get<string>('mail.from'),
          to,
          reply_to: dto.email.trim(),
          subject,
          text,
        }),
      });
    } catch (error) {
      this.logger.error(`Could not reach Resend: ${error}`);
      throw this.sendFailed();
    }
    if (!res.ok) {
      this.logger.error(
        `Resend refused the support email (${res.status}): ${await res.text()}`,
      );
      throw this.sendFailed();
    }
  }

  private sendFailed() {
    return new ServiceUnavailableException(
      'Não foi possível enviar sua mensagem agora. Tente de novo mais tarde.',
    );
  }

  private checkLimit(ip: string) {
    const now = Date.now();
    const recent = (this.sent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= LIMIT) {
      throw new HttpException(
        'Você já enviou várias mensagens. Aguarde a resposta ou tente de novo mais tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.sent.set(ip, recent);
  }
}
