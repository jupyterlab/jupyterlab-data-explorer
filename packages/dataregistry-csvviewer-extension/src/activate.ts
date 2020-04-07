/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { Registry } from '@jupyterlab/dataregistry';
import extension2mimetype from './extension_to_mimetype';
import text2csv from './text_to_csv';
import csv2datagrid from './csv_to_data_grid';

/**
 * Activates the plugin.
 *
 * @private
 * @param app - Jupyter front-end application instance
 * @param registry - JupyterLab data registry
 */
function activate(app: JupyterFrontEnd, registry: Registry) {
  registry.addConverter(extension2mimetype());
  registry.addConverter(text2csv);
  registry.addConverter(csv2datagrid);
}

/**
 * Exports.
 */
export default activate;
