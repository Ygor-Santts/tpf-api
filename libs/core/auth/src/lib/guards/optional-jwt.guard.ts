import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { Request } from 'express';
import { bearerToken, findSessionUser } from './session';

// For public routes that show more to signed-in users: sets request.user when
// a valid token is sent and lets everyone else through as a visitor.
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly em: EntityManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    // An expired or invalid token, or one of a deactivated account, is
    // treated as a visitor.
    const user = token
      ? await findSessionUser(this.jwtService, this.em, token)
      : null;
    if (user) request['user'] = user;
    return true;
  }
}
