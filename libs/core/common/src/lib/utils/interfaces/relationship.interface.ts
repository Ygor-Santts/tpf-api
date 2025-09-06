/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-use-before-define */
import { Collection, Reference } from '@mikro-orm/core';

// References
// https://stackoverflow.com/questions/65332597/typescript-is-there-a-recursive-keyof
// https://www.angularfix.com/2022/01/why-am-i-getting-instantiation-is.html

type Primitives =
  | number
  | number[]
  | string
  | string[]
  | symbol
  | Function
  | Date
  | Date[]
  | bigint
  | boolean
  | undefined
  | null;

type Loadable<T extends object> =
  | Collection<T, any>
  | Reference<T>
  | readonly T[];

type ExtractType<T> = T extends Loadable<infer U> ? U : T;

type CollectionTypes = Collection<any, any> | Reference<any> | object;

type ReturnKeyOfCollectionTypes<
  TCollection,
  KeyCollection extends string,
  RecursiveDepthNumber extends number,
> =
  | KeyCollection
  | `${KeyCollection}.${Recursive<
      ExtractType<TCollection>,
      RecursiveDepth[RecursiveDepthNumber]
    >}`;

type ReturnKeyOfProperties<
  TInterface,
  TPropertyKey extends string,
  RecursiveDepthNumber extends number,
> =
  | TPropertyKey
  | `${TPropertyKey}.${Recursive<
      TInterface,
      RecursiveDepth[RecursiveDepthNumber]
    >}`;

type RecursiveDepth = [never, 0, 1, 2, 3, 4];

type Recursive<T, R extends RecursiveDepth[number] = 4> = [R] extends [never]
  ? never
  : {
      [Key in keyof Exclude<T, null> & string]: Exclude<
        T,
        null
      >[Key] extends Primitives
        ? never
        : Exclude<T, null>[Key] extends CollectionTypes
          ? ReturnKeyOfCollectionTypes<Exclude<T, null>[Key], Key, R>
          : ReturnKeyOfProperties<Exclude<T, null>[Key], Key, R>;
    }[keyof Exclude<T, null> & string];

export type IRelationshipAutoMap<T> = Recursive<T>[];

export type IEntityFields<T> = {
  [Key in keyof T & string]: T[Key] extends Exclude<Primitives, Function>
    ? Key
    : T[Key] extends Function
      ? never
      : T[Key] extends CollectionTypes
        ? Key
        : never;
}[keyof T & string][];
