import { Cost, Dataset, MimeType_, URL_, Data } from "./datasets";
import { mergeMaps } from "./utils";

export type Convert<T, V> = (data: T) => V;
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

/**
 * Applies the converter to a dataset iteratively until all mimetypes are filled out.
 *
 * Uses an implementation of Dijkstra's algorithm.
 */
export function applyConverterDataset(
  url: URL_,
  dataset: Dataset,
  converter: Converter<any, any>
): Dataset {
  // mimeTypes that we still need to convert
  const toProcess: Array<[MimeType_, Cost, Data]> = [...dataset].map(
    ([mimeType, [cost, data$]]) => [mimeType, cost, data$]
  );
  // processed mimetypes
  const processed: Dataset = new Map();
  // We should only process each mimeType once. They will start on the toProcess map
  // and then move to the processed.
  while (toProcess.length !== 0) {
    const [mimeType, cost, data] = toProcess.pop()!;

    // If we already have this mimetype at a lower or equal cost, skip processing it.
    if (processed.has(mimeType) && processed.get(mimeType)![0] <= cost) {
      continue;
    }
    // Otherwise, add it to the processed map
    processed.set(mimeType, [cost, data]);

    // Iterate through its possible conversions and add
    for (const [newMimeType, dataCreator] of converter(mimeType, url)) {
      toProcess.push([newMimeType, cost + 1, dataCreator(data)]);
    }
  }
  return processed;
}

export function combineManyConverters<T, V>(
  ...converters: Array<Converter<T, V>>
): Converter<T, V> {
  return (mimeType: MimeType_, url: URL_) => {
    return mergeMaps(
      // Just choose left one by default
      xData => xData,
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
