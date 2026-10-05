import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  IRatingRepository,
  IWorkerProfileRepository,
} from '../data-access/repositories';
import { CreateRating } from './create-rating';

describe('CreateRating', () => {
  const worker = { id: 7, user: { id: 100 } };
  const createdAt = new Date('2026-01-01T00:00:00Z');

  let ratingRepo: {
    findByWorkerAndAuthor: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let workerRepo: { findById: jest.Mock };
  let useCase: CreateRating;

  beforeEach(() => {
    ratingRepo = {
      findByWorkerAndAuthor: jest.fn().mockResolvedValue(null),
      create: jest.fn((props) => ({ id: 1, createdAt, ...props })),
      save: jest.fn(),
    };
    workerRepo = { findById: jest.fn().mockResolvedValue(worker) };
    useCase = new CreateRating(
      ratingRepo as unknown as IRatingRepository,
      workerRepo as unknown as IWorkerProfileRepository,
    );
  });

  it('throws when the worker does not exist', async () => {
    workerRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(7, 1, 5)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not let a worker rate themselves', async () => {
    await expect(useCase.execute(7, 100, 5)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(ratingRepo.save).not.toHaveBeenCalled();
  });

  it('does not let the same author rate twice', async () => {
    ratingRepo.findByWorkerAndAuthor.mockResolvedValue({ id: 9 });

    await expect(useCase.execute(7, 1, 5)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(ratingRepo.findByWorkerAndAuthor).toHaveBeenCalledWith(7, 1);
    expect(ratingRepo.save).not.toHaveBeenCalled();
  });

  it('saves and returns the new rating', async () => {
    const result = await useCase.execute(7, 1, 4, 'Ótimo trabalho');

    expect(ratingRepo.create).toHaveBeenCalledWith({
      worker,
      authorId: 1,
      score: 4,
      comment: 'Ótimo trabalho',
    });
    expect(ratingRepo.save).toHaveBeenCalled();
    expect(result).toEqual({
      id: 1,
      score: 4,
      comment: 'Ótimo trabalho',
      createdAt,
    });
  });
});
