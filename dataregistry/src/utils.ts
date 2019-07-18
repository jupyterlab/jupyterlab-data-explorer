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

export const NOT_SUBSCRIBED = Symbol("NOT_SUBSCRIBED");
export const COMPLETE = Symbol("COMPLETE");
export const NO_VALUE = Symbol("NO_VALUE");
export const NOT_FINAL = Symbol("NOT_FINAL");

/**
 * We want to capture the last emitted value and whether the observable is finalized yet.
 */
type ObservableState<T> =
  | {
      subscription: Subscription;
      value: T | typeof NO_VALUE;
      final: { error: any } | typeof COMPLETE | typeof NOT_FINAL;
    }
  | typeof NOT_SUBSCRIBED;

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
      const state = this.state.value;
      if (state == NOT_SUBSCRIBED) {
        this.state.next({
          final: NOT_FINAL,
          value: NO_VALUE,
          subscription: from.subscribe(
            v => this._setState({ value: v }),
            e => this._setState({ final: { error: e } }),
            () => this._setState({ final: COMPLETE })
          )
        })
      } else {
        if (state.value !== NO_VALUE) {
          subscriber.next(state.value)
        }
        if (state.final === COMPLETE) {
          subscriber.complete()
        } else if (state.final !== NOT_FINAL) {
          subscriber.error(state.final.error)
        }
      };
      return () => {
        // delete subscriber on cleanup and unsubscribe from parent
        // if there are no others left.
        this._subscribers.delete(subscriber);
        const currentState = this.state.value;
        if (this._subscribers.size === 0 && currentState !== NOT_SUBSCRIBED) {
          currentState.subscription.unsubscribe();
          this.state.next(NOT_SUBSCRIBED);
        }
      };
    });
  }

  private _setState(
    newState: { value: T } | { final: { error: any } | typeof COMPLETE }
  ) {
    const state = this.state.value;
    if (state === NOT_SUBSCRIBED) {
      throw "Should have subscription";
    }
    this.state.next({ ...state, ...newState });
    this._subscribers.forEach(s =>
      "value" in newState
        ? s.next(newState.value)
        : newState.final === COMPLETE
        ? s.complete()
        : s.error(newState.final.error)
    );
  }

  public state = new BehaviorSubject<ObservableState<T>>(NOT_SUBSCRIBED);
  private _subscribers: Set<Subscriber<T>> = new Set();
}
