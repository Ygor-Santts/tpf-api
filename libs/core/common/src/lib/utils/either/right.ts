import { Left } from './left';

export class Right<L, R> {
  constructor(private value: R) {}

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }

  getValue(): R {
    return this.value;
  }
}
