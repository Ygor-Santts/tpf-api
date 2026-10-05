import { NotFoundException } from '@nestjs/common';
import { ICityRepository, IJobOccupationRepository } from '@tpf/common';
import { IWorkerProfileRepository } from '../data-access/repositories';
import { UpdateWorkerProfile } from './update-worker-profile';

describe('UpdateWorkerProfile', () => {
  let worker: any;
  let workerRepo: { findById: jest.Mock; save: jest.Mock };
  let jobOccupationRepo: { getByIds: jest.Mock };
  let cityRepo: { getByIds: jest.Mock };
  let useCase: UpdateWorkerProfile;

  beforeEach(() => {
    worker = {
      id: 7,
      bio: 'antiga',
      user: { name: 'Ana', phone: '1' },
      jobOccupations: { set: jest.fn() },
      operationCities: { set: jest.fn() },
    };
    workerRepo = {
      findById: jest.fn().mockResolvedValue(worker),
      save: jest.fn(),
    };
    jobOccupationRepo = { getByIds: jest.fn().mockResolvedValue([{ id: 1 }]) };
    cityRepo = { getByIds: jest.fn().mockResolvedValue([{ id: 10 }]) };
    useCase = new UpdateWorkerProfile(
      workerRepo as unknown as IWorkerProfileRepository,
      jobOccupationRepo as unknown as IJobOccupationRepository,
      cityRepo as unknown as ICityRepository,
    );
  });

  it('throws when the worker does not exist', async () => {
    workerRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ workerId: 7 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(workerRepo.save).not.toHaveBeenCalled();
  });

  it('only changes the fields that were sent', async () => {
    await useCase.execute({ workerId: 7, bio: 'nova' });

    expect(worker.bio).toBe('nova');
    expect(worker.user).toEqual({ name: 'Ana', phone: '1' });
    expect(jobOccupationRepo.getByIds).not.toHaveBeenCalled();
    expect(cityRepo.getByIds).not.toHaveBeenCalled();
    expect(workerRepo.save).toHaveBeenCalledWith(worker);
  });

  it('updates user data and replaces occupations and cities', async () => {
    await useCase.execute({
      workerId: 7,
      name: 'Ana Maria',
      phone: '2',
      jobOccupationIds: [1],
      operationCitiesIds: [10],
    });

    expect(worker.user).toEqual({ name: 'Ana Maria', phone: '2' });
    expect(jobOccupationRepo.getByIds).toHaveBeenCalledWith([1]);
    expect(worker.jobOccupations.set).toHaveBeenCalledWith([{ id: 1 }]);
    expect(cityRepo.getByIds).toHaveBeenCalledWith([10]);
    expect(worker.operationCities.set).toHaveBeenCalledWith([{ id: 10 }]);
    expect(workerRepo.save).toHaveBeenCalledWith(worker);
  });

  it('clears occupations when an empty list is sent', async () => {
    jobOccupationRepo.getByIds.mockResolvedValue([]);

    await useCase.execute({ workerId: 7, jobOccupationIds: [] });

    expect(worker.jobOccupations.set).toHaveBeenCalledWith([]);
  });
});
