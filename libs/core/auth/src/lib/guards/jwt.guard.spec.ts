import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt.guard';

describe('JwtAuthGuard', () => {
  let verifyAsync: jest.Mock;
  let guard: JwtAuthGuard;

  const contextFor = (request: Record<string, any>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    verifyAsync = jest.fn();
    guard = new JwtAuthGuard({ verifyAsync } as unknown as JwtService);
  });

  it('rejects requests without an Authorization header', async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toThrow(new UnauthorizedException('Token não fornecido'));
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects non-Bearer schemes', async () => {
    const request = { headers: { authorization: 'Basic abc' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      new UnauthorizedException('Token não fornecido'),
    );
  });

  it('rejects invalid or expired tokens', async () => {
    verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const request = { headers: { authorization: 'Bearer bad' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      new UnauthorizedException('Token inválido ou expirado'),
    );
  });

  it('attaches the payload to the request for a valid token', async () => {
    const payload = {
      email: 'ana@example.com',
      userId: 1,
      isWorker: true,
      workerId: 42,
    };
    verifyAsync.mockResolvedValue(payload);
    const request: Record<string, any> = {
      headers: { authorization: 'Bearer good' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('good');
    expect(request['user']).toEqual(payload);
  });
});
