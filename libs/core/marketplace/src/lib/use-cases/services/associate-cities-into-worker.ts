import { HttpException } from '@nestjs/common';

export abstract class IAssociateCitiesIntoWorker {
  abstract execute(
    workerId: number,
    cities: number[],
  ): Promise<void | HttpException>;
}

export class AssociateCitiesIntoWorker implements IAssociateCitiesIntoWorker {
  execute(workerId: number, cities: number[]): Promise<void | HttpException> {
    console.log(`Worker ${workerId} associated with cities ${cities}`);
    return Promise.resolve();
  }
}
