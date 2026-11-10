import { EntityManager } from '@mikro-orm/core';
import { JwtService } from '@nestjs/jwt';
import { User } from '@tpf/domain';

export interface JwtPayload {
  email: string;
  userId: number;
  isWorker: boolean;
  workerId?: number;
  tokenVersion?: number;
}

/** What the guards put in request.user, read from the database. */
export interface SessionUser extends JwtPayload {
  emailVerified: boolean;
  isAdmin: boolean;
}

/**
 * The account behind a token, or null when the token is invalid, the account
 * was deleted or deactivated, or the password changed after the token was
 * issued. Checked on every call, so those take effect at once.
 */
export async function findSessionUser(
  jwtService: JwtService,
  em: EntityManager,
  token: string,
): Promise<SessionUser | null> {
  let payload: JwtPayload;
  try {
    payload = await jwtService.verifyAsync<JwtPayload>(token);
  } catch {
    return null;
  }

  const user = await em
    .fork()
    .findOne(User, { id: payload.userId }, { populate: ['worker'] as any });
  // Tokens from before tokenVersion existed carry none: they count as 0.
  if (!user?.enabled || user.tokenVersion !== (payload.tokenVersion ?? 0))
    return null;

  return {
    email: user.email,
    userId: user.id,
    isWorker: Boolean(user.worker),
    workerId: user.worker?.id,
    tokenVersion: user.tokenVersion,
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
  };
}

export function bearerToken(request: any): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' && token ? token : undefined;
}
