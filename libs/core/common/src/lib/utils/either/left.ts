import { Right } from './right';

export class Left<L, R> {
  constructor(private value: L) {}

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }

  getValue(): L {
    return this.value;
  }
}
