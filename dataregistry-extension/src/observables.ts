import { Observable } from "rxjs";
import { IObservableList } from "@jupyterlab/observables";
import { toArray } from "@phosphor/algorithm";
import { IOutputAreaModel } from "@jupyterlab/outputarea";
import { IOutputModel } from "@jupyterlab/rendermime";


export function observableListToObservable<T>(
  l: IObservableList<T>
): Observable<Array<T>> {
  return new Observable(subscriber => {
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
  return new Observable(subscriber => {
    subscriber.next(toArray());

    function slot() {
      subscriber.next(toArray());
    }

    o.changed.connect(slot);
    return () => o.changed.disconnect(slot);
  });
}
