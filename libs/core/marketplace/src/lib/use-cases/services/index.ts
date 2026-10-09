import { Provider } from '@nestjs/common';
import {
  AssociateCitiesIntoWorker,
  IAssociateCitiesIntoWorker,
} from './associate-cities-into-worker';
import { AddJobOccupation, IAddJobOccupation } from './add-job-occupation';

export const services: Provider[] = [
  { provide: IAssociateCitiesIntoWorker, useClass: AssociateCitiesIntoWorker },
  { provide: IAddJobOccupation, useClass: AddJobOccupation },
];
