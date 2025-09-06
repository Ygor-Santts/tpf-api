import { Injectable } from '@nestjs/common';
import {
  MikroOrmHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

@Injectable()
export class DatabaseHealthCheck {
  private readonly key = 'database';
  constructor(private readonly db: MikroOrmHealthIndicator) {}

  async checkHealth(): Promise<HealthIndicatorResult> {
    return await this.db.pingCheck(this.key, { timeout: 3000 });
  }
}
