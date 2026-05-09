import { Module } from '@nestjs/common';
import { controllers } from './presenter';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CoreCommonModule } from '@tpf/common';
import { services } from './use-cases/services';
import { repositories } from './data-access';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { User, Worker } from '@tpf/domain';
import { JwtAuthGuard } from './guards/jwt.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiration') as StringValue,
        },
      }),
    }),
    MikroOrmModule.forFeature([Worker, User]),
    CoreCommonModule,
  ],
  providers: [...services, ...repositories, JwtAuthGuard],
  controllers: [...controllers],
  exports: [JwtAuthGuard],
})
export class CoreAuthModule {}
