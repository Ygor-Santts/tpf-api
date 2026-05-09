import { Provider } from '@nestjs/common';
import { RegisterWorker, IRegisterWorker } from './register-worker';
import { ILogin, Login } from './login';
import { IRegisterClient, RegisterClient } from './register-client';
import { IGetMe, GetMe } from './get-me';

export const services: Provider[] = [
  { useClass: RegisterWorker, provide: IRegisterWorker },
  { useClass: Login, provide: ILogin },
  { useClass: RegisterClient, provide: IRegisterClient },
  { useClass: GetMe, provide: IGetMe },
];
