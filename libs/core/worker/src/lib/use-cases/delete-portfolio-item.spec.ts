import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { IPortfolioRepository } from '../data-access/repositories';
import { DeletePortfolioItem } from './delete-portfolio-item';

jest.mock('fs/promises', () => ({ unlink: jest.fn() }));

describe('DeletePortfolioItem', () => {
  const item = { id: 3, url: '/uploads/portfolio/7/a.png', worker: { id: 7 } };

  let portfolioRepo: { findById: jest.Mock; delete: jest.Mock };
  let useCase: DeletePortfolioItem;

  beforeEach(() => {
    jest.mocked(unlink).mockReset().mockResolvedValue(undefined);
    portfolioRepo = {
      findById: jest.fn().mockResolvedValue(item),
      delete: jest.fn(),
    };
    useCase = new DeletePortfolioItem(
      portfolioRepo as unknown as IPortfolioRepository,
    );
  });

  it('throws when the item does not exist', async () => {
    portfolioRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(7, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("does not let a worker delete someone else's item", async () => {
    await expect(useCase.execute(8, 3)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(unlink).not.toHaveBeenCalled();
    expect(portfolioRepo.delete).not.toHaveBeenCalled();
  });

  it('removes the file and the record', async () => {
    await useCase.execute(7, 3);

    expect(unlink).toHaveBeenCalledWith(join(process.cwd(), item.url));
    expect(portfolioRepo.delete).toHaveBeenCalledWith(item);
  });

  it('still deletes the record when the file is already gone', async () => {
    jest.mocked(unlink).mockRejectedValue(new Error('ENOENT'));

    await useCase.execute(7, 3);

    expect(portfolioRepo.delete).toHaveBeenCalledWith(item);
  });
});
