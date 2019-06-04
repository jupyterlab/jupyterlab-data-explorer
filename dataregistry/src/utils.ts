import { Observable, BehaviorSubject } from "rxjs";
import { tag } from "rxjs-spy/operators/tag";

/**
 * Combine two maps by merging duplicate keys.
 */
export function mergeMaps<K, V>(
  combine: (l: V, r: V) => V,
  ...xs: Array<Map<K, V>>
): Map<K, V> {
  const res = new Map<K, V>();
  for (const x of xs) {
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
  for (let [k, v] of m) {
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

  constructor() {
    this.observable = this._observable.pipe(tag("ObservableSet"));
  }

  add(value: T) {
    const newSet = new Set(this._observable.value);
    newSet.add(value);
    this._observable.next(newSet);
  }

  remove(value: T) {
    const newSet = new Set(this._observable.value);
    newSet.delete(value);
    this._observable.next(newSet);
  }
}
