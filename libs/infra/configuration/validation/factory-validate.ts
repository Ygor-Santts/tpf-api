import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from '.';

interface IFactoryValidate {
  (): (config: Record<string, unknown>) => EnvironmentVariables;
}

export const factoryValidate: IFactoryValidate =
  () => (config: Record<string, unknown>) => {
    const validatedConfig = plainToInstance<
      EnvironmentVariables,
      Record<string, unknown>
    >(EnvironmentVariables, config, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });

    if (errors.length) {
      throw new Error(errors.toString());
    }

    return validatedConfig;
  };
