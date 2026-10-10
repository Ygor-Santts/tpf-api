import { Provider } from '@nestjs/common';
import { RegisterWorker, IRegisterWorker } from './register-worker';
import { ILogin, Login } from './login';
import { IRegisterClient, RegisterClient } from './register-client';
import { IGetMe, GetMe } from './get-me';
import { IActivateWorker, ActivateWorker } from './activate-worker';
import { IDeleteAccount, DeleteAccount } from './delete-account';
import {
  IForgotPassword,
  ForgotPassword,
  IResetPassword,
  ResetPassword,
} from './password-reset';
import { IMailer, Mailer } from './mailer';
import {
  ISendEmailVerification,
  SendEmailVerification,
  IResendEmailVerification,
  ResendEmailVerification,
  IVerifyEmail,
  VerifyEmail,
} from './email-verification';

export const services: Provider[] = [
  { useClass: RegisterWorker, provide: IRegisterWorker },
  { useClass: Login, provide: ILogin },
  { useClass: RegisterClient, provide: IRegisterClient },
  { useClass: GetMe, provide: IGetMe },
  { useClass: ActivateWorker, provide: IActivateWorker },
  { useClass: ForgotPassword, provide: IForgotPassword },
  { useClass: ResetPassword, provide: IResetPassword },
  { useClass: DeleteAccount, provide: IDeleteAccount },
  { useClass: Mailer, provide: IMailer },
  { useClass: SendEmailVerification, provide: ISendEmailVerification },
  { useClass: ResendEmailVerification, provide: IResendEmailVerification },
  { useClass: VerifyEmail, provide: IVerifyEmail },
];
