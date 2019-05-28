import { Datasets$, Datasets, mergeDatasets } from "./datasets";
import {
  Converter,
  applyConverter$,
  combineManyConverters
} from "./converters";
import { ObservableSet } from "./utils";
import { map } from "rxjs/operators";

export class Registry {
  public readonly datasets$: Datasets$;

  private _converters: ObservableSet<Converter<any, any>> = new ObservableSet();
  private _datasets: ObservableSet<Datasets> = new ObservableSet();

  constructor() {
    this.datasets$ = applyConverter$(
      this._datasets.observable.pipe(
        map(datasets => mergeDatasets(...datasets))
      ),
      this._converters.observable.pipe(
        map(converters => combineManyConverters(...converters))
      )
    );
  }
  /**
   * Adds a new dataseset.
   *
   * If it has already been registered, throws an error.
   */
  addDatasets(datasets: Datasets): () => void {
    this._datasets.add(datasets);
    return () => this._datasets.remove(datasets);
  }

  /**
   * Adds a new converter.
   */
  addConverter(converter: Converter<any, any>): () => void {
    this._converters.add(converter);
    return () => this._converters.remove(converter);
  }
}
