import { Provider } from '@nestjs/common';
import { RegisterWorker, IRegisterWorker } from './register-worker';
import { ILogin, Login } from './login';

export const services: Provider[] = [
  { useClass: RegisterWorker, provide: IRegisterWorker },
  { useClass: Login, provide: ILogin },
];
