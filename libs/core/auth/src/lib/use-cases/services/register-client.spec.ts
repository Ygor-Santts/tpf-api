import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../data-access/repositories';
import { RegisterClient } from './register-client';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));

describe('RegisterClient', () => {
  const dto = {
    name: 'Ana',
    email: 'ana@example.com',
    phone: '5511999999999',
    password: 'StrongP@ssw0rd',
  };

  let userRepository: jest.Mocked<
    Pick<IUserRepository, 'existsByParams' | 'create' | 'save'>
  >;
  let useCase: RegisterClient;

  beforeEach(() => {
    userRepository = {
      existsByParams: jest.fn(),
      create: jest.fn((data) => ({ ...data }) as any),
      save: jest.fn(),
    };
    useCase = new RegisterClient(userRepository as unknown as IUserRepository);
  });

  it('returns a ConflictException when email or phone is taken', async () => {
    userRepository.existsByParams.mockResolvedValue(true);

    const result = await useCase.execute(dto);

    expect(result).toBeInstanceOf(ConflictException);
    expect(userRepository.existsByParams).toHaveBeenCalledWith({
      email: dto.email,
      phone: dto.phone,
    });
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('hashes the password and saves the new user', async () => {
    userRepository.existsByParams.mockResolvedValue(false);

    const result = await useCase.execute(dto);

    expect(result).toBeUndefined();
    expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    expect(userRepository.create).toHaveBeenCalledWith({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: 'hashed',
    });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: dto.email, password: 'hashed' }),
    );
  });
});
