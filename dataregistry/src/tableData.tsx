import { DataTypeNoArgs } from "./datatype";
import * as React from "react";

import NteractDataExplorer, { Props } from "@nteract/data-explorer";
import { widgetDataType } from "./widgets";
import { ReactWidget } from "@jupyterlab/apputils";
import { Dataset } from ".";
import { IRenderMime } from "@jupyterlab/rendermime-interfaces";

import "react-table/react-table.css";

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
    async (data: TableData) => async () => {
      return ReactWidget.create(<NteractDataExplorer data={data} />);
    }
  ]
);

type Register = (datasets: Dataset<any>) => Promise<void>;
class RendererDataset extends ReactWidget implements IRenderMime.IRenderer {
  constructor(private _register: Register) {
    super();
  }

  render() {
    return <div />;
  }
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    this._register(
      TableDataType.createDataset(new URL_("tmp:///"), (model.data[
        TableDataType.mimeType
      ] as unknown) as TableData)
    );
  }
}

export function createTableDataFactory(
  register: Register
): IRenderMime.IRendererFactory {
  return {
    safe: true,
    defaultRank: 1,
    mimeTypes: [TableDataType.mimeType],
    createRenderer: options => new RendererDataset(register)
  };
}
