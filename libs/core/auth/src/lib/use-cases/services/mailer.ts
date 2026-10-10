import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IMail {
  to: string;
  subject: string;
  text: string;
  html: string;
  // Shown in the log instead of the email when no provider is set up.
  link: string;
}

export abstract class IMailer {
  // Never throws and is not meant to be awaited, so a response takes the
  // same time whether or not an email goes out.
  abstract send(mail: IMail): void;
}

// Sends through Resend (resend.com). Without RESEND_API_KEY the link goes to
// the log, except in production.
@Injectable()
export class Mailer implements IMailer {
  private readonly logger = new Logger(Mailer.name);

  constructor(private readonly configService: ConfigService) {}

  send(mail: IMail): void {
    const apiKey = this.configService.get<string>('mail.resendApiKey');
    if (apiKey) {
      void this.post(apiKey, mail);
      return;
    }
    if (this.configService.get<string>('env') === 'production') {
      this.logger.warn(
        `Email "${mail.subject}" not sent: RESEND_API_KEY is not set.`,
      );
      return;
    }
    this.logger.log(`Email "${mail.subject}" for ${mail.to}: ${mail.link}`);
  }

  private async post(apiKey: string, mail: IMail) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.configService.get<string>('mail.from'),
          to: mail.to,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        }),
      });
      if (!res.ok) {
        this.logger.error(
          `Resend refused the email "${mail.subject}" (${res.status}): ${await res.text()}`,
        );
      }
    } catch (error) {
      this.logger.error(`Could not reach Resend: ${error}`);
    }
  }
}
