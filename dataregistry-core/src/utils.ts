import { Observable, combineLatest, Subject } from "rxjs";
import { map, reduce, scan } from "rxjs/operators";

/**
 * Combines two observables of maps by merging their keys.
 */
export function mergeObservableMap<K, V>(
  x: Observable<Map<K, V>>,
  y: Observable<Map<K, V>>,
  combine: (l: V, r: V) => V
): Observable<Map<K, V>> {
  return combineLatest(x, y).pipe(map(([f, s]) => mergeMaps(f, s, combine)));
}

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

type SetEvent<T> = { event: "add" | "remove"; value: T };

/**
 * Implements an observables set. Allows user to imperatively add or remove items and access an observable of the resulting set.
 */
export class ObservableSet<T> {
  public readonly observable: Observable<Set<T>>;

  constructor() {
    this.observable = this._observable.pipe(
      scan((acc, { event, value }) => {
        const newAcc = new Set(acc);
        if (event === "add") {
          newAcc.add(value);
        } else {
          newAcc.delete(value);
        }
        return newAcc;
      }, new Set())
    );
  }

  add(value: T) {
    this._observable.next({ event: "add", value });
  }

  remove(value: T) {
    this._observable.next({ event: "remove", value });
  }

  private _observable: Subject<SetEvent<T>> = new Subject();
}
