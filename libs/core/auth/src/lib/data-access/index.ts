import { Provider } from '@nestjs/common';
import { IUserRepository, UserRepository } from './repositories';
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
];
