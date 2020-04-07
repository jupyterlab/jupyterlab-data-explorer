/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import {
  DataTypeNoArgs,
  Registry,
  createConverter,
} from '@jupyterlab/dataregistry';

import NteractDataExplorer from '@nteract/data-explorer';
import { DataProps } from '@nteract/data-explorer/lib/utilities/types';
import React from 'react';
import { IRegistry } from '@jupyterlab/dataregistry-registry-extension';
import { reactDataType } from './widgets';
import { Observable } from 'rxjs';
import { UseObservable } from './utils';

/**
 * Provides a table data type
 * https://frictionlessdata.io/specs/tabular-data-resource/
 */
export const TableDataType = new DataTypeNoArgs<Observable<DataProps>>(
  'application/vnd.dataresource+json'
);

/**
 * Render table data using nteract's data explorer
 *
 * https://github.com/nteract/nteract/tree/master/packages/data-explorer
 */
const nteractDataExplorerConverter = createConverter(
  { from: TableDataType, to: reactDataType },
  ({ data }) => ({
    type: 'nteract Data Explorer',
    data: (
      <UseObservable observable={data} initial={undefined}>
        {(data) =>
          data ? (
            <NteractDataExplorer
              data={data}
              metadata={{ dx: {} }}
              mediaType="application/vnd.dataresource+json"
              initialView="grid"
            />
          ) : (
            <></>
          )
        }
      </UseObservable>
    ),
  })
);

export default {
  activate: (_, registry: Registry) => {
    registry.addConverter(nteractDataExplorerConverter);
  },
  id: '@jupyterlab/dataregistry-extension:table-data',
  requires: [IRegistry],
  autoStart: true,
} as JupyterFrontEndPlugin<void>;
