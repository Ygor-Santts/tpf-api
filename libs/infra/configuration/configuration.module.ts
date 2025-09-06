import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '.';
import { factoryValidate } from './validation';

@Module({})
export class ConfigurationModule {
  static register(): DynamicModule {
    return {
      module: ConfigurationModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: process.env.NODE_ENV === 'production',
          envFilePath:
            process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
          load: [configuration],
          validate: factoryValidate(),
        }),
      ],
      global: true,
    };
  }
}
