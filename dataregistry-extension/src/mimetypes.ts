/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

/**
 * Table of data registry [MIME][1] types.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */
const mimetypes = {
  "csv": "text/csv",
  "datagrid": "application/x.phosphor.datagrid",
  "datasetsFile": "application/x.jupyterlab.datasets-file",
  "label": "application/x.jupyterlab.label",
  "notebookContext": "application/x.jupyterlab.notebook-context",
  "text": "text/plain",
  "textContext": "application/x.jupyterlab.text-context",
  "widget": "application/x.jupyter.widget"
};

/**
* Exports.
*/
export { mimetypes };
export default mimetypes;