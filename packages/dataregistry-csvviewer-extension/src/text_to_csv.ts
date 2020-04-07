/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { createConverter } from '@jupyterlab/dataregistry';
import datatypes from './datatypes'; // FIXME

// Generate the CSV MIME type:
const CSV_MIME_TYPE: string = datatypes.csv.createMimeType();

/**
 * Exports.
 */
export default createConverter(
  {
    from: datatypes.text,
    to: datatypes.csv,
  },
  ({ type, data }) => {
    if (type === CSV_MIME_TYPE) {
      return data;
    }
    return null;
  }
);
