import { Datasets, Dataset, URL_ } from "./datasets";
import {
  Converter,
  combineManyConverters,
  applyConverterDataset
} from "./converters";
import { resolveDataType } from "./resolvers";

export class Registry {
  /**
   * Returns the dataset for a URL.
   */
  getURL(url: URL_): Dataset {
    if (this._datasets.has(url)) {
      return this._datasets.get(url)!;
    }
    const dataset = applyConverterDataset(
      url,
      resolveDataType.createDataset(),
      this._converter
    );
    this._datasets.set(url, dataset);
    return dataset;
  }

  /**
   * Adds a new converter.
   */
  addConverter(converter: Converter<any, any>): void {
    this._converters.add(converter);
  }

  addDatasets(datasets: Datasets): void {
    this._converters.add(
      (_mimeType, url) =>
        new Map(
          [...(datasets.get(url) || (new Map() as Dataset))].map(
            ([mimeType, [cost, data]]) => [mimeType, () => data]
          )
        )
    );
  }

  public get _converter(): Converter<any, any> {
    return combineManyConverters(...this._converters);
  }

  private readonly _datasets: Datasets = new Map();
  private readonly _converters: Set<Converter<any, any>> = new Set();
}
