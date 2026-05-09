import { Provider } from '@nestjs/common';
import { IWorkerProfileRepository, WorkerProfileRepository } from './worker-profile.repository';
import { IPortfolioRepository, PortfolioRepository } from './portfolio.repository';
import { IRatingRepository, RatingRepository } from './rating.repository';

export const repositories: Provider[] = [
  { provide: IWorkerProfileRepository, useClass: WorkerProfileRepository },
  { provide: IPortfolioRepository, useClass: PortfolioRepository },
  { provide: IRatingRepository, useClass: RatingRepository },
];

export { IWorkerProfileRepository, IPortfolioRepository, IRatingRepository };
