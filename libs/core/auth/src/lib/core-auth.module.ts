import { Module } from '@nestjs/common';
import { controllers } from './presenter';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CoreCommonModule } from '@tpf/common';
import { services } from './use-cases/services';
import { repositories } from './data-access';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, Worker } from '@tpf/domain';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiration'),
        },
      }),
    }),
    MikroOrmModule.forFeature([Worker, User]),
    CoreCommonModule,
  ],
  providers: [...services, ...repositories],
  controllers: [...controllers],
})
export class CoreAuthModule {}
