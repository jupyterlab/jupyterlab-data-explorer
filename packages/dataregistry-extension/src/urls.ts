/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import {
  URLStringConverter,
  resolverURLConverter,
  Registry
} from "@jupyterlab/dataregistry";
import { IRegistry } from "@jupyterlab/dataregistry-registry";

export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:urls",
  requires: [IRegistry],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(_app: JupyterFrontEnd, registry: Registry) {
  registry.addConverter(URLStringConverter);
  registry.addConverter(resolverURLConverter);
}
