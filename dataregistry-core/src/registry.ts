import { Datasets$, Datasets, mergeDatasets } from "./datasets";
import {
  Converter,
  applyConverter$,
  combineManyConverters
} from "./converters";
import { ObservableSet } from "./utils";
import { map, shareReplay } from "rxjs/operators";
import { tag } from "rxjs-spy/operators/tag";
import { Observable } from "rxjs";
import { createNestedConverter } from ".";

export class Registry {
  public readonly datasets$: Datasets$;

  private readonly _converters: ObservableSet<
    Converter<any, any>
  > = new ObservableSet();
  private readonly _datasets: ObservableSet<Datasets> = new ObservableSet();
  private readonly _converter$: Observable<Converter<any, any>>;
  private readonly _datasets$: Datasets$;

  constructor() {
    this._converter$ = this._converters.observable.pipe(
      tag("Registry/converters"),
      map(converters => combineManyConverters(...converters)),
      shareReplay({ bufferSize: 1, refCount: true }),
      tag("Registry/datasets-combined")
    );
    this._datasets$ = this._datasets.observable.pipe(
      tag("Registry/datasets"),
      map(datasets => mergeDatasets(...datasets)),
      shareReplay({ bufferSize: 1, refCount: true }),
      tag("Registry/datasets-merged")
    );
    this.datasets$ = applyConverter$(this._datasets$, this._converter$).pipe(
      tag("Registry/datasets$")
    );

    this.addConverter(createNestedConverter(this._converter$));
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
