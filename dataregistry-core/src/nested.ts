import { DataTypeNoArgs } from "./datatypes";
import { Datasets } from "./datasets";

/**
 * A nested data type has datasets inside of it.
 */
export const nestedDataType = new DataTypeNoArgs<Datasets>(
  "application/x.jupyter.datasets"
);


/**
 * Applies a converter to the nested datatypes
 */
function applyConverterNested(datasets:)