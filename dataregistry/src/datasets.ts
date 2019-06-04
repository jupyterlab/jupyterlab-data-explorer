/**
 * A dataset is the core concept in the data registry. Conceptually,
 * it is a tuple of (url, MimeType, Cost, Data). Here are some examples:
 *
 * ```typescript
 * ["http://some-server/data.csv", "text/csv", 1, "cows,sheap,hands\n10,..."]
 * ["file://Analysis.ipynb#some-dataset", "application/vnd.dataresource+json", 0, {"data": [{"cows": ...}]})
 * ```
 *
 * The way to think about this is that the url is the unique ID to refer to the dataset. Whereas
 * the MimeType is a certain property of the dataset that you know. So you migh know that a dataset
 * has a `application/vnd.dataresource+json` mimetype so you know you can access it in that format.
 * So each mimetype should have a collective shared understanding of what the data means under that context.
 * Often, they correspond to some TypeScript type as well, for example a `text/csv` should have data of type `string`.
 *
 * We store a collection of datasets ([[Datasets]]) in a map of maps: `{url: {MimeType: [Cost, Data]}}` which preserves
 * the url/MimeType uniqueness and allows fast access to see what all the mimetypes are for a dataset.
 *
 * We use the cost to be able to implement a [[mergeDatasets]] function which takes two collections
 * of datasets and merges them, by choosing the data with lower costs, for duplicate url/mimetype pairs.
 *
 * ## Observables
 *
 * This would work great if we could hold all of our datasets at once and they will never change. However,
 * we know that datasets to change over time and anyone caring about that dataset also needs to know when the it has changed.
 * Also, many datasets have keys that are not all stored in memory. For example, if you have a `text/csv` MimeType then you
 * can compute a `application/vnd.dataresource+json` MimeType for the dataset. But you don't wanna do that parsing work
 * and store the result in memory unless someone actually needs that vesion of the dataset.
 *
 * RxJS Observables help us with both of these issues. They provide a pull based data-over-time model, so that data is not produced
 * unless someone actually needs it and subscribes to it and they support a dataset that changes over time.
 *
 * So we wrap each layer of our observable map in an observable, so that the urls available, the MimeTypes available, and
 * the data itself can all change over time.
 */

import { Observable } from "rxjs";
import { mergeMaps } from "./utils";

/**
 * Unique ID. We use a string here instead of the builtin URL class because
 * we are using them as map keys and URLs are not equal based on their contents.
 */
export type URL_ = string;
export type MimeType_ = string;

/**
 * Cost should be >= 0
 */
export type Cost = number;
export type Data = unknown;
export type Data$ = Observable<Data>;

export type DataValue = [Cost, Data$];
export type Dataset = Map<MimeType_, DataValue>;

export type Datasets = Map<URL_, Dataset>;
export type Datasets$ = Observable<Datasets>;

/**
 * Merges datasets, choosing the data with lower cost if there are conflicts.
 */
export function mergeDataset(...datasets: Array<Dataset>): Dataset {
  const merged: Dataset = new Map();
  for (const dataset of datasets) {
    for (const [mimeType, newValue] of dataset) {
      const oldValue = merged.get(mimeType);
      if (!oldValue || newValue[0] < oldValue[0]) {
        merged.set(mimeType, newValue);
      }
    }
  }
  return merged;
}

export function mergeDatasets(...datasets: Array<Datasets>): Datasets {
  return mergeMaps(mergeDataset, ...datasets);
}

export function createDatasets(url: URL_, mimeType: MimeType_, data: Data$) {
  return new Map([[url, new Map([[mimeType, [0, data] as [Cost, Data$]]])]]);
}

export function getURLs(datasets: Datasets): Set<URL_> {
  return new Set(datasets.keys());
}

export function getMimeTypes(datasets: Datasets, url: URL_): Set<MimeType_> {
  const dataset = datasets.get(url);
  return new Set(dataset && [...dataset.keys()]);
}

export function getData$(
  datasets: Datasets,
  url: URL_,
  mimeType: MimeType_
): Data$ | null {
  const dataset = datasets.get(url);
  if (!dataset) {
    return null;
  }
  const dataValue = dataset.get(mimeType);
  if (!dataValue) {
    return null;
  }
  return dataValue[1];
}
