import { NotFoundException } from '@nestjs/common';
import {
  IPortfolioRepository,
  IWorkerProfileRepository,
} from '../data-access/repositories';
import { GetWorkerMe } from './get-worker-me';
import { GetPortfolio } from './get-portfolio';

describe('GetWorkerMe', () => {
  let findById: jest.Mock;
  let useCase: GetWorkerMe;

  beforeEach(() => {
    findById = jest.fn();
    useCase = new GetWorkerMe({
      findById,
    } as unknown as IWorkerProfileRepository);
  });

  it('throws when the worker does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(useCase.execute(7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the profile without the password', async () => {
    findById.mockResolvedValue({
      id: 7,
      bio: 'Pedreiro',
      user: {
        id: 1,
        name: 'Ana',
        email: 'a@x.com',
        phone: '1',
        password: 'hashed',
      },
      jobOccupations: [
        { id: 2, name: 'Pedreiro', category: { id: 3, name: 'Obras' } },
      ],
      operationCities: [{ id: 10, name: 'Campinas', state: 'SP' }],
    });

    await expect(useCase.execute(7)).resolves.toEqual({
      id: 7,
      bio: 'Pedreiro',
      user: { id: 1, name: 'Ana', email: 'a@x.com', phone: '1' },
      jobOccupations: [
        { id: 2, name: 'Pedreiro', category: { id: 3, name: 'Obras' } },
      ],
      operationCities: [{ id: 10, name: 'Campinas' }],
    });
  });
});

describe('GetPortfolio', () => {
  it('maps portfolio items to the response shape', async () => {
    const createdAt = new Date(0);
    const findByWorker = jest.fn().mockResolvedValue([
      {
        id: 1,
        type: 'image',
        url: '/u/1.png',
        caption: 'A',
        createdAt,
        worker: { id: 7 },
      },
    ]);
    const useCase = new GetPortfolio({
      findByWorker,
    } as unknown as IPortfolioRepository);

    await expect(useCase.execute(7)).resolves.toEqual([
      { id: 1, type: 'image', url: '/u/1.png', caption: 'A', createdAt },
    ]);
    expect(findByWorker).toHaveBeenCalledWith(7);
  });
});
