import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CoreCommonModule } from '@tpf/common';
import { CoreAuthModule } from '@tpf/auth';
import { User, Worker, PortfolioItem, Rating } from '@tpf/domain';
import { controllers } from './presenter';
import { repositories } from './data-access/repositories';
import { useCases } from './use-cases';

@Module({
  imports: [
    CoreCommonModule,
    CoreAuthModule,
    MikroOrmModule.forFeature([Worker, User, PortfolioItem, Rating]),
  ],
  controllers: [...controllers],
  providers: [...repositories, ...useCases],
})
export class CoreWorkerModule {}
