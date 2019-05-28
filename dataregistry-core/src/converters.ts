import { Observable, zip } from "rxjs";
import { scan, shareReplay } from "rxjs/operators";
import {
  Cost,
  Dataset,
  Datasets,
  Datasets$,
  mergeDataset,
  MimeType_,
  URL_
} from "./datasets";
import { mapValues, mergeMaps } from "./utils";

export type Convert<T, V> = [Cost, (data: Observable<T>) => Observable<V>];
export type Converts<T, V> = Map<MimeType_, Convert<T, V>>;

/**
 * Function that can possibly convert between data type T to
 * data type V.
 *
 * It determines if it is able to convert T, based on it's mimetype
 * and returns a mapping of possible resulting mimetypes and
 * a function to compute their data.
 *
 * Mimetype comes before url because url is often not needed.
 */
export type Converter<T, V> = (
  mimeType: MimeType_,
  url: URL_
) => Converts<T, V>;

function* applyConverterDataset(
  url: URL_,
  dataset: Dataset,
  converter: Converter<any, any>
): Iterable<Dataset> {
  for (const [mimeType, [cost, data$]] of dataset) {
    const newDataset: Dataset = new Map();
    for (const [newMimeType, [addedCost, dataCreator]] of converter(
      mimeType,
      url
    )) {
      const newCost = cost + addedCost;
      newDataset.set(newMimeType, [
        newCost,
        data$.pipe(
          dataCreator,
          shareReplay({ bufferSize: 1, refCount: true })
        )
      ]);
    }
    yield newDataset;
  }
}

function applyConverterDataset$(
  url: URL_,
  prevDataset: Dataset | undefined,
  dataset: Dataset,
  converter: Converter<any, any>
): Dataset {
  return mergeDataset(
    // Existing datasets
    dataset,
    // Previously converted dataset
    prevDataset || new Map(),
    // Latest conversions
    ...applyConverterDataset(url, dataset, converter)
  );
}
/**
 * Applies the converter to the datasets, defaulting to the keys in the prevDatasets.
 */
function applyConverterDatasets(
  prevDatasets: Datasets,
  datasets: Datasets,
  converter: Converter<any, any>
): Datasets {
  return mapValues(datasets, (url, dataset) =>
    applyConverterDataset$(url, prevDatasets.get(url), dataset, converter)
  );
}

/**
 * Applies each converter to each dataset, returning a new dataset of all the existing values
 * plus all those the converter can get to.
 *
 * We keep the last converted datasets around so that we don't recreate a new conversion
 * if we have already computed it.
 */
export function applyConverter$(
  datasets$: Datasets$,
  converter$: Observable<Converter<any, any>>
): Datasets$ {
  return zip(datasets$, converter$).pipe(
    // Take latest output and merge with most recent
    scan(
      (acc: Datasets, [datasets, converter]) =>
        applyConverterDatasets(acc, datasets, converter),
      new Map()
    )
  );
}

export function combineManyConverters<T, V>(
  ...converters: Array<Converter<T, V>>
): Converter<T, V> {
  return (mimeType: MimeType_, url: URL_) => {
    return mergeMaps(
      (xData, yData) => (xData[0] < yData[0] ? yData : xData),
      ...converters.map(c => c(mimeType, url))
    );
  };
}

export type SingleConvert<T, V> = null | [MimeType_, Convert<T, V>];

/**
 * Helper function to create a creator that has either 0 or 1 resulting mimetypes.
 */
export function singleConverter<T, V>(
  fn: (mimeType: MimeType_, url: URL_) => SingleConvert<T, V>
): Converter<T, V> {
  return (mimeType, url) => {
    const possibleResult = fn(mimeType, url);
    if (possibleResult === null) {
      return new Map();
    }
    return new Map([possibleResult]);
  };
}
