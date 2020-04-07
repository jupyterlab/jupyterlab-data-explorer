/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { DataTypeNoArgs, DataTypeStringArg } from '@jupyterlab/dataregistry';
import { Widget } from '@lumino/widgets';
import { Observable } from 'rxjs';

// TODO: refactor

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
  text: new DataTypeStringArg<Observable<string>>('text/plain', 'mimeType'),
  widget: new DataTypeStringArg<() => Widget>(
    'application/x.jupyter.widget',
    'label'
  ),
};

/**
 * Exports.
 */
export default datatypes;
