import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { clientIp } from './client-ip';
import { RateLimiter } from './rate-limiter';

export interface RateLimitOptions {
  /** Routes with the same name share one count per address. */
  name: string;
  limit: number;
  windowMs: number;
  message?: string;
}

const RATE_LIMIT = 'rate-limit';

/** Limits how often one address calls the route. Use with RateLimitGuard. */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT, options);

const limiters = new Map<string, RateLimiter>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT,
      context.getHandler(),
    );
    if (!options) return true;

    let limiter = limiters.get(options.name);
    if (!limiter) {
      limiter = new RateLimiter(options.limit, options.windowMs);
      limiters.set(options.name, limiter);
    }
    if (!limiter.hit(clientIp(context.switchToHttp().getRequest())))
      throw new HttpException(
        options.message ??
          'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    return true;
  }
}
