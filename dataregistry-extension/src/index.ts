/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { JupyterFrontEndPlugin } from "@jupyterlab/application";
import activePlugin from "./active";
import csvViewerPlugin from "./csvviewer";
import dataRegistryPlugin from "./registry";
import dataExplorerPlugin from "./explorer";
import filesPlugin from "./files";
import snippetsPlugin from "./snippets";
import URLPlugin from "./urls";
import widgetPlugin from "./widgets";
import tableDataPlugin from "./tableData";
import foldersPlugin from "./folders";
export default [
  activePlugin,
  csvViewerPlugin,
  dataExplorerPlugin,
  dataRegistryPlugin,
  filesPlugin,
  snippetsPlugin,
  URLPlugin,
  widgetPlugin,
  tableDataPlugin,
  foldersPlugin
] as JupyterFrontEndPlugin<any>[];
