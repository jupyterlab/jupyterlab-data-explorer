/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import activePlugin from './active';
export * from './active';
import dataExplorerPlugin from './explorer';
export * from './explorer';
import filesPlugin from './files';
export * from './files';
import snippetsPlugin from './snippets';
export * from './snippets';
import URLPlugin from './urls';
export * from './urls';
import widgetPlugin from './widgets';
export * from './widgets';
import tableDataPlugin from './tableData';
export * from './tableData';
import foldersPlugin from './folders';
export * from './folders';
import notebooksPlugin from './notebooks';
export * from './notebooks';
// import debuggerPlugin from "./debugger"; // FIXME: resolve runtime issue with regeneratorRuntime
// export * from "./debugger";
import rendermimePlugin from './rendermime';
export * from './rendermime';
import browserPlugin from './browser';
export * from './browser';
import documentsPlugin from './documents';
export * from './documents';
import filePlugin from './file';
export * from './file';

export default [
  activePlugin,
  documentsPlugin,
  filePlugin,
  browserPlugin,
  dataExplorerPlugin,
  filesPlugin,
  snippetsPlugin,
  URLPlugin,
  widgetPlugin,
  tableDataPlugin,
  foldersPlugin,
  notebooksPlugin,
  // debuggerPlugin,
  rendermimePlugin,
] as JupyterFrontEndPlugin<any>[];
