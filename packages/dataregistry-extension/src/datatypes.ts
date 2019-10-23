/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { DataTypeNoArgs, DataTypeStringArg } from '@jupyterlab/dataregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { DocumentRegistry, Context } from '@jupyterlab/docregistry';
import { Widget } from '@phosphor/widgets';
import { Observable } from 'rxjs';

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
}

/**
 * Table of data registry data types.
 *
 * ## Notes
 *
 * -  See [MDN][1] for MIME type information.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */
const datatypes = {
  csv: new DataTypeNoArgs<Observable<string>>('text/csv'),
  datagrid: new DataTypeNoArgs<Observable<string>>(
    'application/x.phosphor.datagrid'
  ),
  datasetsFile: new DataTypeNoArgs<Observable<Datasets>>(
    'application/x.jupyterlab.datasets-file'
  ),
  label: new DataTypeNoArgs<Observable<string>>(
    'application/x.jupyterlab.label'
  ),
  notebookContext: new DataTypeNoArgs<Observable<Context<INotebookModel>>>(
    'application/x.jupyterlab.notebook-context'
  ),
  text: new DataTypeStringArg<Observable<string>>('text/plain', 'mimeType'),
  textContext: new DataTypeStringArg<
    Observable<Context<DocumentRegistry.ICodeModel>>
  >('application/x.jupyterlab.text-context', 'mimeType'),
  widget: new DataTypeStringArg<() => Widget>(
    'application/x.jupyter.widget',
    'label'
  )
};

/**
 * Exports.
 */
export { Datasets };
export default datatypes;
