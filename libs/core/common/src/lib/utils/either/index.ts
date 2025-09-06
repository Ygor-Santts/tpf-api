import { Left } from './left';
import { Right } from './right';

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(value: L): Either<L, R> => new Left<L, R>(value);
export const right = <L, R>(value: R): Either<L, R> => new Right<L, R>(value);
