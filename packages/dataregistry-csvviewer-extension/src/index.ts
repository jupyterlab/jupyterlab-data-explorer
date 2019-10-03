/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IRegistry } from "@jupyterlab/dataregistry-registry-extension";
import activate from "./activate";

/**
 * Plugin registration data.
 */
const extension: JupyterFrontEndPlugin<void> = {
  "id": "@jupyterlab/dataregistry-extension:csv-viewer",
  "activate": activate,
  "autoStart": true,
  "requires": [IRegistry]
};

/**
 * Exports.
 */
export default extension;
