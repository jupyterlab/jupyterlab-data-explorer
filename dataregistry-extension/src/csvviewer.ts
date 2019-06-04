import { DataGrid } from "@phosphor/datagrid";
import { DSVModel } from "@jupyterlab/csvviewer";
import { DataTypeNoArgs } from "@jupyterlab/dataregistry/lib/datatype";
import {
  JupyterFrontEndPlugin,
  JupyterFrontEnd
} from "@jupyterlab/application";
import { IDataRegistry } from "./registry";
import { Registry } from "@jupyterlab/dataregistry";
import { map } from "rxjs/operators";

export const CSVDataType = new DataTypeNoArgs<string>("text/csv");

export const CSVConverter = CSVDataType.createSingleTypedConverter(
  widgetDataType,
  () => [
    "Grid",
    [
      1,
      map((data: string) => async () => {
        // TODO: reuse `CSVViewer`
        const grid = new DataGrid({
          baseRowSize: 24,
          baseColumnSize: 144,
          baseColumnHeaderSize: 36,
          baseRowHeaderSize: 64
        });
        grid.headerVisibility = "all";
        grid.model = new DSVModel({ data, delimiter: "," });
        return grid;
      })
    ]
  ]
);

const id = "@jupyterlab/dataregistry-extension:csv-viewer";

export default {
  activate,
  id,
  requires: [IDataRegistry],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(app: JupyterFrontEnd, registry: Registry): void {
  registry.addConverter(CSVConverter);
}
