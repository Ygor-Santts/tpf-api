import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { User } from '@tpf/domain';
import { JwtAuthGuard, JwtPayload } from './jwt.guard';

/**
 * Only for admin accounts. Checked against the database on every call, so
 * removing the admin flag or deactivating the account takes effect at once.
 */
@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(
    jwtService: JwtService,
    private readonly em: EntityManager,
  ) {
    super(jwtService);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const { userId } = context.switchToHttp().getRequest()[
      'user'
    ] as JwtPayload;
    const user = await this.em.fork().findOne(User, { id: userId });
    if (!user?.isAdmin || !user.enabled)
      throw new ForbiddenException('Acesso restrito ao administrador.');
    return true;
  }
}
