import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";

type url = string;
type MimeType = string;

// Cost must be >= 0
type Cost = number;
type Data = unknown;

type Dataset = Observable<Map<MimeType, [Cost, Observable<Data>]>>;
// Datasets is a nested mapping of (url, MimeType, Cost, Data) pairs.
type Datasets = Observable<Map<url, Dataset>>;

/**
 * Conceptually this concatonates all the datasets, removing any that have the same url and MimeType by choosing the one with the lower cost.
 */
export function mergeDatasets(x: Datasets, y: Datasets): Datasets {
  return mergeObservableMap(x, y, (xDataset, yDataset) =>
    mergeObservableMap(xDataset, yDataset, ([xCost, xData], [yCost, yData]) =>
      yCost < xCost ? [yCost, yData] : [xCost, xData]
    )
  );
}

/**
 * Combines two observables of maps by merging their keys.
 */
function mergeObservableMap<K, V>(
  x: Observable<Map<K, V>>,
  y: Observable<Map<K, V>>,
  combine: (l: V, r: V) => V
): Observable<Map<K, V>> {
  return combineLatest(x, y).pipe(map(([f, s]) => mergeMaps(f, s, combine)));
}

/**
 * Combine two maps by merging duplicate keys.
 */
function mergeMaps<K, V>(
  x: Map<K, V>,
  y: Map<K, V>,
  combine: (l: V, r: V) => V
): Map<K, V> {
  const res = new Map(x);
  for (let [k, v] of y) {
    const otherV = res.get(k);
    if (otherV !== undefined) {
      v = combine(otherV, v);
    }
    res.set(k, v);
  }
  return res;
}
