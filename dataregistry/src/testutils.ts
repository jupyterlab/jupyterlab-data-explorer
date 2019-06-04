import { Observable } from "rxjs";
import { tag } from "rxjs-spy/operators/tag";

/**
 * A testing util that takes in an observables and lets you await each next.
 */
export class ToPromises<T> {
  private readonly _promises = Array<(value: T) => void>();
  private readonly _values = Array<T>();
  get next(): Promise<T> {
    const value = this._values.pop();
    if (value !== undefined) {
      return Promise.resolve(value);
    }
    return new Promise(resolve => this._promises.push(resolve));
  }
  constructor(observable: Observable<T>) {
    observable.pipe(tag("ToPromise")).subscribe(next => {
      const promise = this._promises.pop();
      if (promise === undefined) {
        this._values.push(next);
      } else {
        promise(next);
      }
    });
  }
}
