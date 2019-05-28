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
