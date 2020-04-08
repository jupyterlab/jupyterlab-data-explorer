/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { createConverter } from '@jupyterlab/dataregistry';
import datatypes from './datatypes'; // FIXME
import DataGrid from './data_grid';
import { Widget } from '@lumino/widgets';

/**
 * Exports.
 */
export default createConverter(
  {
    from: datatypes.csv,
    to: datatypes.widget,
  },
  ({ data }) => ({ type: 'Grid', data: (): Widget => new DataGrid(data) })
);
