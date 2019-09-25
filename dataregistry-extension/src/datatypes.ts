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
import { mimetypes }  from "./mimetypes"

/**
 * Custom type for storing datasets.
 *
 * ## Notes
 *
 * -   A dataset may consist of (and link to) other datasets.
 */
type Datasets = {
  children?: Array<string>;
  datasets?: Array<{
    url: string;
    children?: Array<string>;
    label?: string;
    snippets?: { [key: string]: string };
  }>;
};

/**
 * Table of data registry data types.
 */
const datatypes = {
	"csv": new DataTypeNoArgs<Observable<string>>(mimetypes.csv),
	"datagrid": new DataTypeNoArgs<Observable<string>>(mimetypes.datagrid),
	"datasetsFile": new DataTypeNoArgs<Observable<Datasets>>(mimetypes.datasetsFile),
	"label": new DataTypeNoArgs<Observable<string>>(mimetypes.label),
	"notebookContext": new DataTypeNoArgs<Observable<Context<INotebookModel>>>(mimetypes.notebookContext),
	"text": new DataTypeStringArg<Observable<string>>("text/plain","mimeType"),
	"textContext": new DataTypeStringArg<Observable<Context<DocumentRegistry.ICodeModel>>>(mimetypes.textContext, "mimeType"),
	"widget": new DataTypeStringArg<() => Widget>(mimetypes.widget, "label")
};

/**
* Exports.
*/
export { datatypes };
export { Datasets };
export default datatypes;