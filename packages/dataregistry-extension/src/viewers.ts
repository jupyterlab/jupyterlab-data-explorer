/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { DataTypeStringArg } from '@jupyterlab/dataregistry';

/**
 * Subscribe to this observable to view the dataset. The label should be display in the UI for the user.
 */
export const viewerDataType = new DataTypeStringArg<() => void>(
  'application/x.jupyter.viewer',
  'label'
);
