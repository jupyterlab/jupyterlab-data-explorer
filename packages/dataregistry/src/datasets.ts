/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

/**
 * A dataset is the core concept in the data registry. Conceptually,
 * it is a tuple of (URL, MimeType, Cost, Data). Here are some examples:
 *
 * ```typescript
 * ["http://some-server/data.csv", "text/csv", 1, "cows,sheap,hands\n10,..."]
 * ["file:///Analysis.ipynb#some-dataset", "application/vnd.dataresource+json", 0, {"data": [{"cows": ...}]})
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

export type DataValue<T> = [Cost, T];
export type Dataset<T> = Map<MimeType_, DataValue<T>>;

export type Datasets<T> = Map<URL_, Dataset<T>>;

export function createDataset<T>(mimeType: MimeType_, data: T): Dataset<T> {
  return new Map([[mimeType, [0, data]]]);
}

export function createDatasets<T>(
  url: URL_,
  mimeType: MimeType_,
  data: T
): Datasets<T> {
  return new Map([[url, createDataset(mimeType, data)]]);
}

export function getURLs(datasets: Datasets<any>): Set<URL_> {
  return new Set(datasets.keys());
}

export function getMimeTypes(
  datasets: Datasets<any>,
  url: URL_
): Set<MimeType_> {
  const dataset = datasets.get(url);
  return new Set(dataset && [...dataset.keys()]);
}

export function getData<T>(
  datasets: Datasets<T>,
  url: URL_,
  mimeType: MimeType_
): T | null {
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
