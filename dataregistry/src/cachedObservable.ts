import {
  Observable,
  BehaviorSubject,
  Subscriber,
  Subscription,
  Observer
} from "rxjs";

/**
 * Possible states our observables can be in.
 */
const enum State {
  initial = "initial",
  waitingFirst = "waiting first",
  waitingNext = "waiting next",
  waitingFirstSubs = "waiting first and subscribed",
  waitingNextSubs = "waiting next and subscribed",
  complete = "complete",
  error = "error"
}
/**
 * We want to capture the last emitted value and whether the observable is finalized yet.
 */
type ObservableState<T> =
  // Initial state before  anyone subscries
  | { state: State.initial }
  // Someone is subscribed and waiting for the first value
  | {
      state: State.waitingFirst;
      subscribers: Set<Subscriber<T>>;
    }
  | {
      state: State.waitingFirstSubs;
      subscription: Subscription;
      subscribers: Set<Subscriber<T>>;
    }
  // We have an initial value and we are waiting for the next
  | {
      state: State.waitingNext;
      subscribers: Set<Subscriber<T>>;
      value: T;
    }
  | {
      state: State.waitingNextSubs;
      subscription: Subscription;
      subscribers: Set<Subscriber<T>>;
      value: T;
    }
  // The backing subscription has finished and we have a final value
  | { state: State.complete; value: T }
  // The backing subscription last errored
  | { state: State.error; error: any };

/**
 * `CachedObservable` is a refcounted observable that maintains a maximum of one subscription to its source.
 *
 * If at any time, it has no subscribers, it will unsubscribe from its source.
 *
 * Why use this over the `refCount` operator? Well we store the last value on the object for easier debugging and introspection.
 *
 * States:
 *  1. Not subscribed yet
 *  2. Subscribed and waiting for final state
 *  3. In final state, unsubscribed
 *
 * New subscriber:
 * 1. If in state 1, then subscribe, move to state 2
 * 2. if in state 2, return last value
 * 3. If in state 3 and ended in Done, return last value
 * 4. If in state 3 and ended in error, move to state 2, to retry the computation
 *
 * Unsubscribe:
 * 1. Should never be in state one when unsubscribing
 * 2. if this is last subscription, unsubscribe from parent
 */
export class CachedObservable<T> extends Observable<T> {
  public static from<T>(from: Observable<T>): CachedObservable<T> {
    if (from instanceof CachedObservable) {
      return from;
    }
    return new CachedObservable(from);
  }
  private constructor(from: Observable<T>) {
    super(subscriber => {
      const state = this.state.value;
      switch (state.state) {
        case State.error:
        case State.initial:
          const subscribers = new Set([subscriber]);
          this.state.next({
            state: State.waitingFirst,
            subscribers
          });
          const subscription = from.subscribe(this.observer);
          const newState = this.state.value;
          if (newState.state === State.waitingFirst) {
            this.state.next({
              ...newState,
              state: State.waitingFirstSubs,
              subscription
            });
          } else if (newState.state === State.waitingNext) {
            this.state.next({
              ...newState,
              state: State.waitingNextSubs,
              subscription
            });
          } else {
            throw new Error(
              `Cannot be in state ${newState.state} after subscribing`
            );
          }

          break;
        case State.waitingFirst:
        case State.waitingFirstSubs:
          state.subscribers.add(subscriber);
          break;
        case State.waitingNextSubs:
        case State.waitingNext:
          state.subscribers.add(subscriber);
          subscriber.next(state.value);
          break;
        case State.complete:
          subscriber.next(state.value);
          return () => {};
        default:
          const _exhaustiveCheck: never = state;
      }
      return () => {
        const state = this.state.value;
        switch (state.state) {
          case State.initial:
            throw new Error(
              "Should not be in initial state when unsubscribing"
            );
          case State.waitingFirst:
            throw new Error(
              "Should not be waiting for subscription and first when unsubscribing"
            );
          case State.waitingNext:
            throw new Error(
              "Should not be waiting for subscription and next when unsubscribing"
            );
          case State.waitingNextSubs:
          case State.waitingFirstSubs:
            state.subscribers.delete(subscriber);
            if (state.subscribers.size === 0) {
              state.subscription.unsubscribe();
              this.state.next({ state: State.initial });
            }
            return;
          case State.complete:
          case State.error:
            return;
          default:
            const _exhaustiveCheck: never = state;
        }
      };
    });
  }

  private get observer(): Observer<T> {
    return {
      next: value => {
        const state = this.state.value;
        switch (state.state) {
          case State.initial:
            throw new Error("Shouldn't be in initial state on next");
          case State.waitingNext:
          case State.waitingFirst:
            this.state.next({
              ...state,
              state: State.waitingNext,
              value
            });
            state.subscribers.forEach(s => s.next(value));
            return;
          case State.waitingNextSubs:
          case State.waitingFirstSubs:
            this.state.next({
              ...state,
              state: State.waitingNextSubs,
              value
            });
            state.subscribers.forEach(s => s.next(value));
            return;
          case State.complete:
            throw new Error("Shouldn't be in complete state on next");
          case State.error:
            throw new Error("Shouldn't be in error state on next");
          default:
            const _exhaustiveCheck: never = state;
        }
      },
      error: error => {
        const state = this.state.value;
        switch (state.state) {
          case State.initial:
            throw new Error("Shouldn't be in initial state on error");
          case State.waitingFirst:
          case State.waitingFirstSubs:
          case State.waitingNext:
          case State.waitingNextSubs:
            this.state.next({ state: State.error, error });
            return;
          case State.complete:
            throw new Error("Shouldn't be in complete state on error");
          case State.error:
            throw new Error("Shouldn't be in error state on error");
          default:
            const _exhaustiveCheck: never = state;
        }
      },
      complete: () => {
        const state = this.state.value;
        switch (state.state) {
          case State.initial:
            throw new Error("Shouldn't be in initial state on complete");
          case State.waitingFirst:
          case State.waitingFirstSubs:
            throw new Error("Should have recieved value before complete");
          case State.waitingNext:
          case State.waitingNextSubs:
            this.state.next({ state: State.complete, value: state.value });
            return;
          case State.complete:
            throw new Error("Shouldn't be in complete state on complete");
          case State.error:
            throw new Error("Shouldn't be in error state on complete");
          default:
            const _exhaustiveCheck: never = state;
        }
      }
    };
  }
  public state = new BehaviorSubject<ObservableState<T>>({
    state: State.initial
  });
}
