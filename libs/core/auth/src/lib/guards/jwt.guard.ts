import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { Request } from 'express';
import { bearerToken, findSessionUser } from './session';

export { JwtPayload, SessionUser } from './session';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    protected readonly em: EntityManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    if (!token) throw new UnauthorizedException('Token não fornecido');
    const user = await findSessionUser(this.jwtService, this.em, token);
    if (!user) throw new UnauthorizedException('Token inválido ou expirado');
    request['user'] = user;
    return true;
  }
}
