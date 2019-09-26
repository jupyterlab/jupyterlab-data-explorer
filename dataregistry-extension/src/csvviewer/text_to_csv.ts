/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { createConverter } from "@jupyterlab/dataregistry";
import { datatypes } from "./../datatypes";
import { mimetypes } from "./../mimetypes";

/**
 * Interface describing an object containing data to convert.
 *
 * @private
 */
interface Data {
  /**
   * Data to convert.
   */
  data: any;

  /**
   * Desired data type.
   */
  type: string;
}

/**
 * Returns a converter for converting text data to CSV.
 *
 * @private
 * @returns data type converter
 */
function text2csv() {
  const conversion = {
    "from": datatypes.text,
    "to": datatypes.csv
  };

  return createConverter(conversion, convert);

  /**
   * Converts from text data to CSV.
   *
   * @private
   * @param obj - data object
   * @param obj.data - data to convert
   * @param obj.type - desired type
   * @returns converted data
   */
  function convert(obj: Data) {
    if (obj.type === mimetypes.csv) {
      return obj.data;
    }
    return null;
  }
}

/**
 * Exports.
 */
export default text2csv;