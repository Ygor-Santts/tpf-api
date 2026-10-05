import { NotFoundException } from '@nestjs/common';
import {
  IPortfolioRepository,
  IWorkerProfileRepository,
} from '../data-access/repositories';
import { UploadPortfolioItem } from './upload-portfolio-item';

describe('UploadPortfolioItem', () => {
  const worker = { id: 7 };

  let portfolioRepo: { create: jest.Mock; save: jest.Mock };
  let workerRepo: { findById: jest.Mock };
  let useCase: UploadPortfolioItem;

  beforeEach(() => {
    portfolioRepo = {
      create: jest.fn((props) => ({ id: 3, createdAt: new Date(0), ...props })),
      save: jest.fn(),
    };
    workerRepo = { findById: jest.fn().mockResolvedValue(worker) };
    useCase = new UploadPortfolioItem(
      portfolioRepo as unknown as IPortfolioRepository,
      workerRepo as unknown as IWorkerProfileRepository,
    );
  });

  it('throws when the worker does not exist', async () => {
    workerRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(7, { filename: 'a.png', mimetype: 'image/png' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(portfolioRepo.save).not.toHaveBeenCalled();
  });

  it('stores images under the worker folder', async () => {
    const result = await useCase.execute(
      7,
      { filename: 'a.png', mimetype: 'image/png' },
      'Cozinha',
    );

    expect(portfolioRepo.create).toHaveBeenCalledWith({
      worker,
      type: 'image',
      url: '/uploads/portfolio/7/a.png',
      caption: 'Cozinha',
    });
    expect(portfolioRepo.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 3,
      type: 'image',
      url: '/uploads/portfolio/7/a.png',
    });
  });

  it('detects videos from the mimetype', async () => {
    await useCase.execute(7, { filename: 'b.mp4', mimetype: 'video/mp4' });

    expect(portfolioRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'video' }),
    );
  });
});
