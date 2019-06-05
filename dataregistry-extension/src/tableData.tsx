/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { JupyterFrontEndPlugin } from "@jupyterlab/application";
import { DataTypeNoArgs, Registry } from "@jupyterlab/dataregistry";

import NteractDataExplorer, { Props } from "@nteract/data-explorer";
import * as React from "react";
import "react-table/react-table.css";
import { reactDataType } from "./widgets";
import { Observable } from "rxjs";
import { RegistryToken } from "./registry";
import { UseObservable } from "./utils";

/**
 * Provides a table data type
 * https://frictionlessdata.io/specs/tabular-data-resource/
 */
export const TableDataType = new DataTypeNoArgs<Observable<Props["data"]>>(
  "application/vnd.dataresource+json"
);

/**
 * Render table data using nteract's data explorer
 *
 * https://github.com/nteract/nteract/tree/master/packages/data-explorer
 */
const nteractDataExplorerConverter = TableDataType.createSingleTypedConverter(
  reactDataType,
  () => [
    "nteract Data Explorer",
    data$ => (
      <UseObservable observable={data$} initial={undefined}>
        {data =>
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
    )
  ]
);

export default {
  activate: (_, registry: Registry) => {
    registry.addConverter(nteractDataExplorerConverter);
  },
  id: "@jupyterlab/dataregistry-extension:table-data",
  requires: [RegistryToken],
  autoStart: true
} as JupyterFrontEndPlugin<void>;
