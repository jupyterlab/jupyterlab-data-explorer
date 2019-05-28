import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";

/**
 * 
 * TODO:
 * 
 * 
 */

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
  

  export function mapValues<K, V, VP>(m : Map<K, V>, fn: (key: K, value: V) => VP): Map<K, VP> {
    const res = new Map<K, VP>();
    for (let [k, v] of m) {
      res.set(k, fn(k, v))
    }
    return res;
  }