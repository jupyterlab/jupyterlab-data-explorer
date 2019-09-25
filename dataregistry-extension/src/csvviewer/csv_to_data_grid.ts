/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { createConverter } from "@jupyterlab/dataregistry";
import { datatypes } from "./../datatypes";
import { DataGrid } from "./data_grid";

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
}

/**
 * Returns a converter for converting CSV data to a data grid.
 *
 * @private
 * @returns data type converter
 */
function csv2datagrid() {
  const conversion = {
    "from": datatypes.csv,
    "to": datatypes.widget
  };

  return createConverter(conversion, convert);

  /**
   * Converts CSV data to a data grid.
   *
   * @private
   * @param obj - data object
   * @param obj.data - data to convert
   * @returns converted data
   */
  function convert(obj: Data) {
    return {
      "type": "Grid",
      "data": getData
    };

    /**
     * Returns a data grid.
     *
     * @private
     * @returns data grid
     */
    function getData() {
      return new DataGrid(obj.data);
    }
  }
}

/**
 * Exports.
 */
export { csv2datagrid };
export default csv2datagrid;