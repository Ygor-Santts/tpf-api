import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule, MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { EntityCaseNamingStrategy, MySqlDriver } from '@mikro-orm/mysql';

@Module({})
export class DatabaseModule {
  static register(): DynamicModule {
    const factory = (configService: ConfigService): MikroOrmModuleOptions => {
      const isProduction = configService.get<string>('env') === 'production';

      return {
        driver: MySqlDriver,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        user: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        dbName: configService.get<string>('database.database'),
        autoLoadEntities: true,
        namingStrategy: EntityCaseNamingStrategy,
        debug: !isProduction,
      };
    };

    return {
      module: DatabaseModule,
      imports: [
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: factory,
        }),
      ],
      global: true,
    };
  }
}
