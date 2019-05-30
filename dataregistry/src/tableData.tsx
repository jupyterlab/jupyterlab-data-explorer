import { ReactWidget } from "@jupyterlab/apputils";
import { DataTypeNoArgs } from "@jupyterlab/dataregistry-core";
import NteractDataExplorer, { Props } from "@nteract/data-explorer";
import * as React from "react";
import "react-table/react-table.css";
import { map } from "rxjs/operators";
import { widgetDataType } from "./widgets";

/**
 * Type for table data.
 */
export type TableData = Props["data"];

/**
 * Provides a table data type
 * https://frictionlessdata.io/specs/tabular-data-resource/
 */
export const TableDataType = new DataTypeNoArgs<TableData>(
  "application/vnd.dataresource+json"
);

/**
 * Render table data using nteract's data explorer
 *
 * https://github.com/nteract/nteract/tree/master/packages/data-explorer
 */
export const nteractDataExplorerConverter = TableDataType.createSingleTypedConverter(
  widgetDataType,
  () => [
    "nteract Data Explorer",
    [
      1,
      map(data => async () =>
        ReactWidget.create(<NteractDataExplorer data={data} /> as any)
      )
    ]
  ]
);
