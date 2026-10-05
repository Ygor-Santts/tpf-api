import { IRatingRepository } from '../data-access/repositories';
import { GetRatings } from './get-ratings';
import { GetRatingSummary } from './get-rating-summary';

describe('GetRatings', () => {
  it('maps ratings to the response shape with pagination info', async () => {
    const createdAt = new Date(0);
    const findByWorker = jest.fn().mockResolvedValue([
      [
        {
          id: 1,
          score: 5,
          comment: 'Top',
          createdAt,
          author: { name: 'Bia', password: 'x' },
        },
        { id: 2, score: 3, comment: null, createdAt, author: null },
      ],
      12,
    ]);
    const useCase = new GetRatings({
      findByWorker,
    } as unknown as IRatingRepository);

    const result = await useCase.execute(7, 2, 10);

    expect(findByWorker).toHaveBeenCalledWith(7, 2, 10);
    expect(result).toEqual({
      data: [
        { id: 1, score: 5, comment: 'Top', createdAt, authorName: 'Bia' },
        { id: 2, score: 3, comment: null, createdAt, authorName: undefined },
      ],
      total: 12,
      page: 2,
      limit: 10,
    });
  });
});

describe('GetRatingSummary', () => {
  it('returns the summary from the repository', async () => {
    const getRatingSummary = jest
      .fn()
      .mockResolvedValue({ average: 4.5, count: 2 });
    const useCase = new GetRatingSummary({
      getRatingSummary,
    } as unknown as IRatingRepository);

    await expect(useCase.execute(7)).resolves.toEqual({
      average: 4.5,
      count: 2,
    });
    expect(getRatingSummary).toHaveBeenCalledWith(7);
  });
});
