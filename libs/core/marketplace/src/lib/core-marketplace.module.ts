import { Module } from '@nestjs/common';
import { services } from './use-cases/services';
import { views } from './use-cases/views';
import { repositories } from './data-access';
import { providers } from './provider';
import { controllers } from './presenter';
import { CoreCommonModule } from '@tpf/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User, Worker } from '@tpf/domain';

@Module({
  imports: [CoreCommonModule, MikroOrmModule.forFeature([User, Worker])],
  controllers: [...controllers],
  providers: [...repositories, ...views, ...services, ...providers],
})
export class CoreMarketplaceModule {}
