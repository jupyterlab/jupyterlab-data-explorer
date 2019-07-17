import { Observable, BehaviorSubject, Subscriber, Subscription } from "rxjs";
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

type ObservableValue<T> =
  | { next: T }
  | { error: any }
  | typeof COMPLETE
  | typeof NO_VALUE;
/**
 * Implements an observables set. Allows user to imperatively add or remove items and access an observable of the resulting set.
 */
export class ObservableSet<T> {
  public readonly observable: Observable<Set<T>>;

  private readonly _observable: BehaviorSubject<Set<T>> = new BehaviorSubject(
    new Set()
  );

  constructor(values?: Iterable<T>) {
    this.observable = this._observable.pipe(tag("ObservableSet"));
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

export const NO_VALUE = Symbol("NO_VALUE");
export const COMPLETE = Symbol("COMPLETE");

/**
 * `CachedObservable` is a refcounted observable that maintains a maximum of one subscription to its source.
 *
 * If at any time, it has no subscribers, it will unsubscribe from its source.
 *
 * Why use this over the `refCount` operator? Well we store the last value on the object for easier debugging and introspection.
 */
export class CachedObservable<T> extends Observable<T> {
  constructor(from: Observable<T>) {
    super(subscriber => {
      this._subscribers.add(subscriber);
      if (!this._subscription) {
        this._subscription = from.subscribe({
          next: v => {
            this.value.next({ next: v });
            this._subscribers.forEach(s => s.next(v));
          },
          error: e => {
            this.value.next({ error: e });
            this._subscribers.forEach(s => s.error(e));
          },
          complete: () => {
            this.value.next(COMPLETE);
            this._subscribers.forEach(s => s.complete());
          }
        });
      }
      return () => {
        // delete subscriber on cleanup and unsubscribe from parent
        // if there are no others left.
        this._subscribers.delete(subscriber);
        if (this._subscribers.size === 0) {
          this._subscription!.unsubscribe();
          this._subscription = null;
        }
      };
    });
  }

  public value = new BehaviorSubject<ObservableValue<T>>(NO_VALUE);
  private _subscribers: Set<Subscriber<T>> = new Set();
  private _subscription: Subscription | null = null;
}
