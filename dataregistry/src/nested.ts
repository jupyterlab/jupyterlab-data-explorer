/**
 * * Switch data to not have to be observable.
 * * In registry just have an observable of adding and removing lists of
 *
 * A nested dataset has an observable set of URLs of other datasets that are within it.
 *
 * The user story here is:
 *
 * * User expands folder in data registry
 * * We subscribe to the nested datasets within that URL.
 * * For each of the URLs, we registry that as a resolve dataset.
 *
 * ---
 *
 * * In the registry, assume the converters don't change and we can only register URLs
 * * We also assume we just have a set of URLs and a set of converters.
 * * In the registry, we have a `register` function that takes in a URL
 *
 * * For the explorer, we have a top level `explorer:` URL that has a list of URLS to display.
 */

import { URL_ } from "./datasets";
import { DataTypeNoArgs, createConverter } from "./datatypes";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * a list of relative URLs to resolve against the current URL.
 *
 * Uses an array instead of a set and ends in +json for notebook mimetype compatability
 */
export const relativeNestedDataType = new DataTypeNoArgs<
  Observable<Array<string>>
>("application/x.jupyter.relative-dataset-urls+json");

/**
 * A nested data type has datasets inside of it.
 */
export const nestedDataType = new DataTypeNoArgs<Observable<Set<URL_>>>(
  "application/x.jupyter.dataset-urls"
);

export const relativeNestedURLConverter = createConverter(
  { from: relativeNestedDataType, to: nestedDataType },
  ({ data, url }) =>
    data.pipe(
      map(relURLs => new Set(relURLs.map(relURL => new URL(relURL, url).href)))
    )
);
