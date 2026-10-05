import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUser, PasswordResetToken } from '@tpf/domain';
import {
  IPasswordResetTokenRepository,
  IUserRepository,
} from '../../data-access/repositories';
import { IPasswordResetNotifier } from '../../notifications/password-reset.notifier';
import { ForgotPassword } from './forgot-password';
import { ResetPassword } from './reset-password';
import { hashPasswordResetToken } from './password-reset-token';

const makeUser = (overrides: Partial<IUser> = {}) =>
  ({
    id: 1,
    email: 'john@example.com',
    password: 'old-hash',
    enabled: true,
    changePassword(this: IUser, hash: string) {
      this.password = hash;
    },
    ...overrides,
  }) as unknown as IUser;

const makeTokenRepository = () =>
  ({
    create: jest.fn((dto) => PasswordResetToken.create(dto)),
    save: jest.fn(),
    findByTokenHash: jest.fn(),
    findActiveByUser: jest.fn().mockResolvedValue([]),
    saveWithUser: jest.fn(),
  }) as jest.Mocked<IPasswordResetTokenRepository>;

describe('ForgotPassword', () => {
  const config = { get: () => 60 } as unknown as ConfigService;

  it('stores a hashed token and notifies the user', async () => {
    const user = makeUser();
    const users = {
      findUserByParams: jest.fn().mockResolvedValue(user),
    } as unknown as IUserRepository;
    const tokens = makeTokenRepository();
    const notifier = { notify: jest.fn() } as IPasswordResetNotifier;

    await new ForgotPassword(users, tokens, notifier, config).execute({
      email: user.email,
    });

    const rawToken = (notifier.notify as jest.Mock).mock.calls[0][1];
    const saved = tokens.save.mock.calls[0][0] as PasswordResetToken[];
    expect(saved).toHaveLength(1);
    expect(saved[0].tokenHash).toBe(hashPasswordResetToken(rawToken));
    expect(saved[0].tokenHash).not.toBe(rawToken);
    expect(saved[0].isValid()).toBe(true);
  });

  it('invalidates previous active tokens', async () => {
    const user = makeUser();
    const previous = PasswordResetToken.create({
      user,
      tokenHash: 'old',
      expiresAt: new Date(Date.now() + 60_000),
    });
    const users = {
      findUserByParams: jest.fn().mockResolvedValue(user),
    } as unknown as IUserRepository;
    const tokens = makeTokenRepository();
    tokens.findActiveByUser.mockResolvedValue([previous]);

    await new ForgotPassword(
      users,
      tokens,
      { notify: jest.fn() },
      config,
    ).execute({ email: user.email });

    expect(previous.isValid()).toBe(false);
  });

  it('does nothing for an unknown email', async () => {
    const users = {
      findUserByParams: jest.fn().mockResolvedValue(null),
    } as unknown as IUserRepository;
    const tokens = makeTokenRepository();
    const notifier = { notify: jest.fn() } as IPasswordResetNotifier;

    await expect(
      new ForgotPassword(users, tokens, notifier, config).execute({
        email: 'nobody@example.com',
      }),
    ).resolves.toBeUndefined();
    expect(tokens.save).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });
});

describe('ResetPassword', () => {
  it('changes the password and consumes the token', async () => {
    const user = makeUser();
    const token = PasswordResetToken.create({
      user,
      tokenHash: hashPasswordResetToken('raw'),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const tokens = makeTokenRepository();
    tokens.findByTokenHash.mockResolvedValue(token);

    const result = await new ResetPassword(tokens).execute({
      token: 'raw',
      password: 'NewPassw0rd',
    });

    expect(result).toBeUndefined();
    expect(tokens.findByTokenHash).toHaveBeenCalledWith(
      hashPasswordResetToken('raw'),
    );
    expect(bcrypt.compareSync('NewPassw0rd', user.password)).toBe(true);
    expect(token.isValid()).toBe(false);
    expect(tokens.saveWithUser).toHaveBeenCalledWith(token, user);
  });

  it.each([
    ['unknown', null],
    [
      'expired',
      PasswordResetToken.create({
        user: makeUser(),
        tokenHash: 'h',
        expiresAt: new Date(Date.now() - 1000),
      }),
    ],
  ])('rejects an %s token', async (_, token) => {
    const tokens = makeTokenRepository();
    tokens.findByTokenHash.mockResolvedValue(token);

    const result = await new ResetPassword(tokens).execute({
      token: 'raw',
      password: 'NewPassw0rd',
    });

    expect(result).toBeInstanceOf(BadRequestException);
    expect(tokens.saveWithUser).not.toHaveBeenCalled();
  });

  it('rejects a token that was already used', async () => {
    const token = PasswordResetToken.create({
      user: makeUser(),
      tokenHash: 'h',
      expiresAt: new Date(Date.now() + 60_000),
    });
    token.markAsUsed();
    const tokens = makeTokenRepository();
    tokens.findByTokenHash.mockResolvedValue(token);

    const result = await new ResetPassword(tokens).execute({
      token: 'raw',
      password: 'NewPassw0rd',
    });

    expect(result).toBeInstanceOf(BadRequestException);
  });
});
