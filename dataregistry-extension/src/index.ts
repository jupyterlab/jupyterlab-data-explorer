/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { JupyterFrontEndPlugin } from "@jupyterlab/application";
import activePlugin from "./active";
import converterRegistryPlugin from "./converters";
import csvViewerPlugin from "./csvviewer";
import dataRegistryPlugin from "./dataregistry";
import datasetsPlugin from "./datasets";
import dataExplorerPlugin from "./explorer";
import filePlugin from "./file";
import filesPlugin from "./files";
import renderMimePlugin from "./rendermime";
import snippetsPlugin from "./snippets";
import URL_Plugin from "./urls";
import widgetPlugin from "./widgets";
import tableDataPlugin from './tableData'

export default [
  activePlugin,
  converterRegistryPlugin,
  csvViewerPlugin,
  dataExplorerPlugin,
  dataRegistryPlugin,
  datasetsPlugin,
  filePlugin,
  filesPlugin,
  renderMimePlugin,
  snippetsPlugin,
  URL_Plugin,
  widgetPlugin,
  tableDataPlugin
] as JupyterFrontEndPlugin<any>[];
