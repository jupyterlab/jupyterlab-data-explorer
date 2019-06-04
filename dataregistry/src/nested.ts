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

import { Observable } from "rxjs";
import { applyConverter$, Converter } from "./converters";
import { Datasets } from "./datasets";
import { DataTypeNoArgs } from "./datatypes";

/**
 * A nested data type has datasets inside of it.
 */
export const nestedDataType = new DataTypeNoArgs<Datasets>(
  "application/x.jupyter.datasets"
);

export const convertedNestedDataType = new DataTypeNoArgs<Datasets>(
  "application/x.jupyter.converted-datasets"
);

/**
 * Given some converter, returns a converter that will apply it to the nested datasets.
 */
export function createNestedConverter(
  converter$: Observable<Converter<any, any>>
): Converter<Datasets, Datasets> {
  return nestedDataType.createSingleTypedConverter(
    convertedNestedDataType,
    () => [, [1, datasets$ => applyConverter$(datasets$, converter$)]]
  );
}
