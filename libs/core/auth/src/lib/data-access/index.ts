import { Provider } from '@nestjs/common';
import {
  IPasswordResetTokenRepository,
  IUserRepository,
  PasswordResetTokenRepository,
  UserRepository,
} from './repositories';
import {
  IWorkerRepository,
  WorkerRepository,
} from './repositories/worker.repository';

export const repositories: Provider[] = [
  {
    provide: IUserRepository,
    useClass: UserRepository,
  },
  {
    provide: IWorkerRepository,
    useClass: WorkerRepository,
  },
  {
    provide: IPasswordResetTokenRepository,
    useClass: PasswordResetTokenRepository,
  },
];
