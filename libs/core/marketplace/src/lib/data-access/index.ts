import { Provider } from '@nestjs/common';
import {
  IWorkerRepository,
  WorkerRepository,
} from './repositories/worker.repository';

export const repositories: Provider[] = [
  {
    provide: IWorkerRepository,
    useClass: WorkerRepository,
  },
];
