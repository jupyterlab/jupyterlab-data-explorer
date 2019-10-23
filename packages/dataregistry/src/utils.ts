/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { Observable, BehaviorSubject } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';

/**
 * Combine two maps by merging duplicate keys.
 */
export function mergeMaps<K, V>(
  combine: (l: V, r: V) => V,
  ...xs: Array<Map<K, V>>
): Map<K, V> {
  const res = new Map<K, V>();
  for (const x of xs) {
    // eslint-disable-next-line prefer-const
    for (let [k, v] of x) {
      const otherV = res.get(k);
      if (otherV !== undefined) {
        v = combine(otherV, v);
      }
      res.set(k, v);
    }
  }
  return res;
}

export function mapValues<K, V, VP>(
  m: Map<K, V>,
  fn: (key: K, value: V) => VP
): Map<K, VP> {
  const res = new Map<K, VP>();
  for (const [k, v] of m) {
    res.set(k, fn(k, v));
  }
  return res;
}

/**
 * Implements an observables set. Allows user to imperatively add or remove items and access an observable of the resulting set.
 */
export class ObservableSet<T> {
  public readonly observable: Observable<Set<T>>;

  private readonly _observable: BehaviorSubject<Set<T>> = new BehaviorSubject(
    new Set()
  );

  constructor(values?: Iterable<T>) {
    this.observable = this._observable.pipe(tag('ObservableSet'));
    if (values) {
      this.add(...values);
    }
  }

  add(...values: Array<T>) {
    const newSet = new Set(this._observable.value);
    for (const value of values) {
      newSet.add(value);
    }
    this._observable.next(newSet);
  }

  remove(...values: Array<T>) {
    const newSet = new Set(this._observable.value);
    for (const value of values) {
      newSet.delete(value);
    }
    this._observable.next(newSet);
  }
}
