import { Provider } from '@nestjs/common';
import {
  AssociateCitiesIntoWorker,
  IAssociateCitiesIntoWorker,
} from './associate-cities-into-worker';

export const services: Provider[] = [
  { provide: IAssociateCitiesIntoWorker, useClass: AssociateCitiesIntoWorker },
];
