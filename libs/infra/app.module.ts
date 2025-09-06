import { Module } from '@nestjs/common';
import {
  AppController,
  ConfigurationModule,
  DatabaseHealthCheck,
  DatabaseModule,
} from '.';
import { TerminusModule } from '@nestjs/terminus';
import { CoreCommonModule } from '@tpf/common';
import { CoreAuthModule } from '@tpf/auth';
import { CoreMarketplaceModule } from '@tpf/marketplace';
import { CoreAnalyticsModule } from '@tpf/analytics';

@Module({
  imports: [
    ConfigurationModule.register(),
    DatabaseModule.register(),
    TerminusModule,
    CoreCommonModule,
    CoreAuthModule,
    CoreMarketplaceModule,
    CoreAnalyticsModule,
  ],
  controllers: [AppController],
  providers: [DatabaseHealthCheck],
})
export class AppModule {}
