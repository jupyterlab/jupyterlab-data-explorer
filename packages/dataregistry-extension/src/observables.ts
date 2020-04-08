/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { Observable } from 'rxjs';
import { IObservableList, IObservableString } from '@jupyterlab/observables';
import { toArray } from '@lumino/algorithm';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { IOutputModel } from '@jupyterlab/rendermime';

export function observableStringToObservable(
  l: IObservableString
): Observable<string> {
  return new Observable((subscriber) => {
    subscriber.next(l.text);

    function slot() {
      subscriber.next(l.text);
    }

    l.changed.connect(slot);
    return () => l.changed.disconnect(slot);
  });
}
export function observableListToObservable<T>(
  l: IObservableList<T>
): Observable<Array<T>> {
  return new Observable((subscriber) => {
    subscriber.next(toArray(l.iter()));

    function slot() {
      subscriber.next(toArray(l.iter()));
    }

    l.changed.connect(slot);
    return () => l.changed.disconnect(slot);
  });
}

export function outputAreaModelToObservable(
  o: IOutputAreaModel
): Observable<Array<IOutputModel>> {
  function toArray(): Array<IOutputModel> {
    const a = new Array<IOutputModel>();
    for (let i = 0; i < o.length; i++) {
      a.push(o.get(i));
    }
    return a;
  }
  return new Observable((subscriber) => {
    subscriber.next(toArray());

    function slot() {
      subscriber.next(toArray());
    }

    o.changed.connect(slot);
    return () => o.changed.disconnect(slot);
  });
}
