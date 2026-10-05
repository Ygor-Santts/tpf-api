import { ConflictException, NotFoundException } from '@nestjs/common';
import { ICityRepository, IJobOccupationRepository } from '@tpf/common';
import { IUserRepository } from '../../data-access/repositories';
import { IWorkerRepository } from '../../data-access/repositories/worker.repository';
import { RegisterWorker } from './register-worker';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));

describe('RegisterWorker', () => {
  const dto = {
    name: 'Ana',
    email: 'ana@example.com',
    phone: '5511999999999',
    password: 'StrongP@ssw0rd',
    jobOccupationIds: [1, 2],
    operationCitiesIds: [10],
  };

  const occupations = [{ id: 1 }, { id: 2 }];
  const cities = [{ id: 10 }];

  let userRepository: {
    existsByParams: jest.Mock;
    create: jest.Mock;
    saveWorkerUser: jest.Mock;
  };
  let workerRepository: { create: jest.Mock };
  let jobOccupationRepository: { getByIds: jest.Mock };
  let cityRepository: { getByIds: jest.Mock };
  let useCase: RegisterWorker;

  beforeEach(() => {
    userRepository = {
      existsByParams: jest.fn().mockResolvedValue(false),
      create: jest.fn((data) => ({ ...data, setWorker: jest.fn() })),
      saveWorkerUser: jest.fn(),
    };
    workerRepository = { create: jest.fn((data) => ({ ...data })) };
    jobOccupationRepository = {
      getByIds: jest.fn().mockResolvedValue(occupations),
    };
    cityRepository = { getByIds: jest.fn().mockResolvedValue(cities) };
    useCase = new RegisterWorker(
      userRepository as unknown as IUserRepository,
      workerRepository as unknown as IWorkerRepository,
      jobOccupationRepository as unknown as IJobOccupationRepository,
      cityRepository as unknown as ICityRepository,
    );
  });

  it('returns a ConflictException when email or phone is taken', async () => {
    userRepository.existsByParams.mockResolvedValue(true);

    const result = await useCase.execute(dto);

    expect(result).toBeInstanceOf(ConflictException);
    expect(jobOccupationRepository.getByIds).not.toHaveBeenCalled();
    expect(userRepository.saveWorkerUser).not.toHaveBeenCalled();
  });

  it('returns a NotFoundException listing every missing reference', async () => {
    jobOccupationRepository.getByIds.mockResolvedValue([{ id: 1 }]);
    cityRepository.getByIds.mockResolvedValue([]);

    const result = await useCase.execute(dto);

    expect(result).toBeInstanceOf(NotFoundException);
    expect((result as NotFoundException).message).toBe(
      'Profissões de trabalho não encontradas; Cidades de operação não encontradas',
    );
    expect(userRepository.saveWorkerUser).not.toHaveBeenCalled();
  });

  it('creates the user and worker and saves them together', async () => {
    const result = await useCase.execute(dto);

    expect(result).toBeUndefined();
    expect(jobOccupationRepository.getByIds).toHaveBeenCalledWith(
      dto.jobOccupationIds,
    );
    expect(cityRepository.getByIds).toHaveBeenCalledWith(
      dto.operationCitiesIds,
    );

    const user = userRepository.create.mock.results[0].value;
    expect(user).toMatchObject({ email: dto.email, password: 'hashed' });

    const worker = workerRepository.create.mock.results[0].value;
    expect(worker).toEqual({
      user,
      jobOccupations: occupations,
      operationCities: cities,
    });
    expect(user.setWorker).toHaveBeenCalledWith(worker);
    expect(userRepository.saveWorkerUser).toHaveBeenCalledWith(user, worker);
  });
});
