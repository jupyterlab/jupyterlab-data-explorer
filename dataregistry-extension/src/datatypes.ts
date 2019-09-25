/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { DataTypeNoArgs, DataTypeStringArg } from "@jupyterlab/dataregistry";
import { INotebookModel } from "@jupyterlab/notebook";
import { DocumentRegistry, Context } from "@jupyterlab/docregistry";
import { Widget } from "@phosphor/widgets";
import { Observable } from "rxjs";
import { mimetypes }  from "./mimetypes";

/**
 * Interface describing a dataset.
 */
interface Dataset {
  /**
   * Dataset URL.
   */
  url: string;

  /**
   * List of child dataset identifiers.
   */
  children?: Array<string>;

  /**
   * Dataset label.
   */
  label?: string;

  /**
   * Code snippets.
   */
  snippets?: { [key: string]: string };
}

/**
 * Interface for describing datasets.
 *
 * ## Notes
 *
 * -   Each dataset may consist of (and link to) other datasets.
 */
interface Datasets {
  /**
   * List of child dataset identifiers.
   */
  children?: Array<string>;

  /**
   * List of datasets.
   */
  datasets?: Array<Dataset>;
};

/**
 * Table of data registry data types.
 */
const datatypes = {
  "csv": new DataTypeStringArg<Observable<string>>(mimetypes.csv, "mimeType"), // FIXME
  "datagrid": new DataTypeNoArgs<Observable<string>>(mimetypes.datagrid),
  "datasetsFile": new DataTypeNoArgs<Observable<Datasets>>(mimetypes.datasetsFile),
  "label": new DataTypeNoArgs<Observable<string>>(mimetypes.label),
  "notebookContext": new DataTypeNoArgs<Observable<Context<INotebookModel>>>(mimetypes.notebookContext),
  "text": new DataTypeStringArg<Observable<string>>("text/plain", "mimeType"),
  "textContext": new DataTypeStringArg<Observable<Context<DocumentRegistry.ICodeModel>>>(mimetypes.textContext, "mimeType"),
  "widget": new DataTypeStringArg<() => Widget>(mimetypes.widget, "label")
};

/**
 * Exports.
 */
export { datatypes };
export { Datasets };
export default datatypes;