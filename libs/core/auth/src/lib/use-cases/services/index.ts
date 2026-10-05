import { Provider } from '@nestjs/common';
import { RegisterWorker, IRegisterWorker } from './register-worker';
import { ILogin, Login } from './login';
import { IRegisterClient, RegisterClient } from './register-client';
import { IGetMe, GetMe } from './get-me';
import { IForgotPassword, ForgotPassword } from './forgot-password';
import { IResetPassword, ResetPassword } from './reset-password';
import {
  IPasswordResetNotifier,
  LogPasswordResetNotifier,
} from '../../notifications/password-reset.notifier';

export const services: Provider[] = [
  { useClass: RegisterWorker, provide: IRegisterWorker },
  { useClass: Login, provide: ILogin },
  { useClass: RegisterClient, provide: IRegisterClient },
  { useClass: GetMe, provide: IGetMe },
  { useClass: ForgotPassword, provide: IForgotPassword },
  { useClass: ResetPassword, provide: IResetPassword },
  { useClass: LogPasswordResetNotifier, provide: IPasswordResetNotifier },
];
