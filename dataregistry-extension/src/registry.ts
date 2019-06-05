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
export const RegistryToken = new Token<Registry>(
  "@jupyterlab/dataregistry:Registry"
);

/**
 * The converter registry extension.
 */
export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:data-registry",
  requires: [],
  provides: RegistryToken,
  autoStart: true
} as JupyterFrontEndPlugin<Registry>;

function activate(_app: JupyterFrontEnd): Registry {
  return new Registry();
}
