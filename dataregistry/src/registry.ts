import { Datasets, Dataset, URL_ } from "./datasets";
import {
  Converter,
  combineManyConverters,
  applyConverterDataset
} from "./converters";
import { resolveDataType } from "./resolvers";
import { BehaviorSubject, Observable, of } from "rxjs";
import { externalURLDataType, internalURLDataType } from "./external";

export class Registry {
  /**
   * Set of URLs which have been regstered so far.
   */
  public readonly URLs$: BehaviorSubject<Set<URL_>>;
  constructor() {
    this.URLs$ = new BehaviorSubject(new Set(this._datasets.keys()));
  }
  /**
   * Returns the dataset for a URL.
   */
  getURL(url: URL_): Dataset<unknown> {
    if (this._datasets.has(url)) {
      return this._datasets.get(url)!;
    }
    const dataset = applyConverterDataset(
      url,
      resolveDataType.createDataset(),
      this._converter
    );
    this._datasets.set(url, dataset);

    // Triggger update on registed URLs
    this.URLs$.next(new Set([url, ...this.URLs$.value]));

    return dataset;
  }

  /**
   * Returns the external URL for a dataset or itself if it has not external pointer.
   */
  externalURL(url: URL_): Observable<URL_> {
    return externalURLDataType.getDataset(this.getURL(url)) || of(url);
  }

  /**
   * Returns the internal URL for a dataset or itself if it has not external pointer.
   */
  internalURL(url: URL_): Observable<URL_> {
    return internalURLDataType.getDataset(this.getURL(url)) || of(url);
  }

  /**
   * Adds a new converter.
   */
  addConverter(...converters: Array<Converter<any, any>>): void {
    converters.forEach(converter => this._converters.add(converter));
  }

  addDatasets(datasets: Datasets<any>): void {
    this._converters.add(({ mimeType, url }) =>
      mimeType == resolveDataType.createMimeType() && datasets.has(url)
        ? [...datasets.get(url)!.entries()].map(([mimeType, [cost, data]]) => ({
            mimeType,
            cost,
            data
          }))
        : []
    );
  }

  public get _converter(): Converter<any, any> {
    return combineManyConverters(...this._converters);
  }

  private readonly _datasets: Datasets<unknown> = new Map();
  private readonly _converters: Set<Converter<any, any>> = new Set();
}
