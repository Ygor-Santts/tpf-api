import { Provider } from '@nestjs/common';
import { IGetWorkerMe, GetWorkerMe } from './get-worker-me';
import { IUpdateWorkerProfile, UpdateWorkerProfile } from './update-worker-profile';
import { IUploadPortfolioItem, UploadPortfolioItem } from './upload-portfolio-item';
import { IDeletePortfolioItem, DeletePortfolioItem } from './delete-portfolio-item';
import { IGetPortfolio, GetPortfolio } from './get-portfolio';
import { ICreateRating, CreateRating } from './create-rating';
import { IGetRatings, GetRatings } from './get-ratings';
import { IGetRatingSummary, GetRatingSummary } from './get-rating-summary';

export const useCases: Provider[] = [
  { provide: IGetWorkerMe, useClass: GetWorkerMe },
  { provide: IUpdateWorkerProfile, useClass: UpdateWorkerProfile },
  { provide: IUploadPortfolioItem, useClass: UploadPortfolioItem },
  { provide: IDeletePortfolioItem, useClass: DeletePortfolioItem },
  { provide: IGetPortfolio, useClass: GetPortfolio },
  { provide: ICreateRating, useClass: CreateRating },
  { provide: IGetRatings, useClass: GetRatings },
  { provide: IGetRatingSummary, useClass: GetRatingSummary },
];

export {
  IGetWorkerMe, IUpdateWorkerProfile, IUploadPortfolioItem,
  IDeletePortfolioItem, IGetPortfolio, ICreateRating, IGetRatings, IGetRatingSummary,
};
