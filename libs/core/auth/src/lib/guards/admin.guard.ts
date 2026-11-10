import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtAuthGuard, SessionUser } from './jwt.guard';

/**
 * Only for admin accounts. Like every signed-in route, the account is read
 * from the database on each call, so removing the admin flag or deactivating
 * the account takes effect at once.
 */
@Injectable()
export class AdminGuard extends JwtAuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const user = context.switchToHttp().getRequest()['user'] as SessionUser;
    if (!user.isAdmin)
      throw new ForbiddenException('Acesso restrito ao administrador.');
    return true;
  }
}
