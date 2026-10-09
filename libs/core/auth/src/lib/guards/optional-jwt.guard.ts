import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './jwt.guard';

// For public routes that show more to signed-in users: sets request.user when
// a valid token is sent and lets everyone else through as a visitor.
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) return true;
    try {
      request['user'] = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      // An expired or invalid token is treated as a visitor.
    }
    return true;
  }
}
