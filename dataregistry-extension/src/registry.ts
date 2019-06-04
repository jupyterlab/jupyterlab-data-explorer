/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import { Token } from "@phosphor/coreutils";
import { Registry } from "@jupyterlab/dataregistry";
export const IDataRegistry = new Token<Registry>(
  "@jupyterlab/dataregistry:IDataRegistry"
);

/**
 * The converter registry extension.
 */
export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:data-registry",
  requires: [],
  provides: IDataRegistry,
  autoStart: true
} as JupyterFrontEndPlugin<Registry>;

function activate(_app: JupyterFrontEnd): Registry {
  return new Registry();
}
