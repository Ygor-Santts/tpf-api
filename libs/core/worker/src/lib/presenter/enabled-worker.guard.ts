import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';

/**
 * A deactivated worker's public pages (portfolio, ratings) answer 404, like
 * their profile and search already do. Reads the worker id from `:id`.
 */
@Injectable()
export class EnabledWorkerGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const id = Number(context.switchToHttp().getRequest().params.id);
    const [row] = await this.em
      .fork()
      .execute(
        'select 1 as ok from worker w join user u on u.id = w.user_id where w.id = ? and u.enabled = true',
        [id],
      );
    if (!row) throw new NotFoundException('Worker não encontrado');
    return true;
  }
}
