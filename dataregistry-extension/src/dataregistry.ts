/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import { IDataRegistry } from "@jupyterlab/dataregistry";
import { Registry } from "@jupyterlab/dataregistry-core";

/**
 * The converter registry extension.
 */
export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:data-registry",
  requires: [],
  provides: IDataRegistry,
  autoStart: true
} as JupyterFrontEndPlugin<IDataRegistry>;

function activate(app: JupyterFrontEnd): IDataRegistry {
  return new Registry();
}
