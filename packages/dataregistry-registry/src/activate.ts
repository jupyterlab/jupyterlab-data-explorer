/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { Registry, relativeNestedURLConverter } from "@jupyterlab/dataregistry";

/**
 * Activates the plugin.
 *
 * @private
 * @returns registry instance
 */
function activate(): Registry {
  const registry = new Registry();
  registry.addConverter(relativeNestedURLConverter);
  return registry;
}

/**
 * Exports.
 */
export default activate;