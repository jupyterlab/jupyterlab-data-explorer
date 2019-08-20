/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import {
  URLStringConverter,
  resolverURLConverter,
  Registry
} from "@jupyterlab/dataregistry";
import { IRegistry } from "./registry";

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
