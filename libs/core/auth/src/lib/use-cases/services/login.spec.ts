import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../data-access/repositories';
import { Login } from './login';

describe('Login', () => {
  const password = 'StrongP@ssw0rd';
  const hash = bcrypt.hashSync(password, 4);

  let userRepository: jest.Mocked<
    Pick<IUserRepository, 'findUserWithWorker' | 'save'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let login: Login;

  const makeUser = (worker?: { id: number }) => ({
    id: 1,
    name: 'Ana',
    email: 'ana@example.com',
    phone: '5511999999999',
    password: hash,
    worker,
    loggedIn: jest.fn(),
  });

  beforeEach(() => {
    userRepository = { findUserWithWorker: jest.fn(), save: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    login = new Login(
      userRepository as unknown as IUserRepository,
      jwtService as unknown as JwtService,
    );
  });

  it('returns a NotFoundException when the user does not exist', async () => {
    userRepository.findUserWithWorker.mockResolvedValue(null);

    const result = await login.execute({ email: 'x@example.com', password });

    expect(result).toBeInstanceOf(NotFoundException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns a NotFoundException when the password does not match', async () => {
    const user = makeUser();
    userRepository.findUserWithWorker.mockResolvedValue(user as any);

    const result = await login.execute({
      email: user.email,
      password: 'wrong-password',
    });

    expect(result).toBeInstanceOf(NotFoundException);
    expect(user.loggedIn).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('records the login and returns a token for a client user', async () => {
    const user = makeUser();
    userRepository.findUserWithWorker.mockResolvedValue(user as any);

    const result = await login.execute({ email: user.email, password });

    expect(user.loggedIn).toHaveBeenCalled();
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      email: user.email,
      userId: 1,
      isWorker: false,
      workerId: undefined,
    });
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: 1,
        name: 'Ana',
        email: user.email,
        phone: user.phone,
        isWorker: false,
        workerId: undefined,
      },
    });
  });

  it('includes worker data in the token and profile for a worker user', async () => {
    const user = makeUser({ id: 42 });
    userRepository.findUserWithWorker.mockResolvedValue(user as any);

    const result = await login.execute({ email: user.email, password });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ isWorker: true, workerId: 42 }),
    );
    expect(result).toMatchObject({ user: { isWorker: true, workerId: 42 } });
  });
});
