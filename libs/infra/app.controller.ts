import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { DatabaseHealthCheck } from '.';

@Controller('health-check')
export class AppController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly databaseHealthCheck: DatabaseHealthCheck,
  ) {}

  @Get()
  @HealthCheck()
  healthCheck(): Promise<HealthCheckResult> {
    Logger.log(`Get /health-check`);
    return this.health.check([() => this.databaseHealthCheck.checkHealth()]);
  }
}
