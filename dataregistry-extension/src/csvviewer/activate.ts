/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { JupyterFrontEnd } from "@jupyterlab/application";
import { Registry, DataTypeNoArgs, createConverter, resolveExtensionConverter } from "@jupyterlab/dataregistry";
import { datatypes } from "./../datatypes";
import { mimetypes } from "./../mimetypes";
import { CSVDataGrid } from "./data_grid";

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
 * Returns a converter for converting from a resolver MIME type to a file MIME type.
 *
 * @private
 * @returns data type converter
 */
function extension2mimetype() {
  return resolveExtensionConverter(".csv", mimetypes.csv);
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
      return new CSVDataGrid(obj.data);
    }
  }
}

/**
 * Activates the plugin.
 *
 * @private
 * @param app - Jupyter front-end application instance
 * @param registry - JupyterLab data registry
 */
function activate(app: JupyterFrontEnd, registry: Registry) {
  registry.addConverter(extension2mimetype());
  registry.addConverter(text2csv());
  registry.addConverter(csv2datagrid());
}

/**
 * Exports.
 */
export default activate;
