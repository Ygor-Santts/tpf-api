import { Module, Provider } from '@nestjs/common';
import {
  City,
  CityRepository,
  ICityRepository,
  IJobCategoryRepository,
  IJobOccupationRepository,
  JobCategory,
  JobCategoryRepository,
  JobOccupation,
  JobOccupationRepository,
} from './data-access';
import { MikroOrmModule } from '@mikro-orm/nestjs';

const entities = [City, JobCategory, JobOccupation];
const repositories: Provider[] = [
  {
    provide: IJobCategoryRepository,
    useClass: JobCategoryRepository,
  },
  {
    provide: IJobOccupationRepository,
    useClass: JobOccupationRepository,
  },
  {
    provide: ICityRepository,
    useClass: CityRepository,
  },
];

@Module({
  imports: [MikroOrmModule.forFeature(entities)],
  providers: [...repositories],
  exports: [...repositories],
})
export class CoreCommonModule {}
