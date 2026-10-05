import { NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../data-access/repositories';
import { GetMe } from './get-me';

describe('GetMe', () => {
  let findUserById: jest.Mock;
  let useCase: GetMe;

  beforeEach(() => {
    findUserById = jest.fn();
    useCase = new GetMe({ findUserById } as unknown as IUserRepository);
  });

  it('throws when the user does not exist', async () => {
    findUserById.mockResolvedValue(null);

    await expect(useCase.execute(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the profile without leaking the password', async () => {
    findUserById.mockResolvedValue({
      id: 1,
      name: 'Ana',
      email: 'ana@example.com',
      phone: '5511999999999',
      password: 'hashed',
      worker: { id: 42 },
    });

    await expect(useCase.execute(1)).resolves.toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@example.com',
      phone: '5511999999999',
      isWorker: true,
      workerId: 42,
    });
  });

  it('marks users without a worker as clients', async () => {
    findUserById.mockResolvedValue({
      id: 2,
      name: 'Bia',
      email: 'b@x.com',
      phone: '1',
    });

    await expect(useCase.execute(2)).resolves.toMatchObject({
      isWorker: false,
      workerId: undefined,
    });
  });
});
