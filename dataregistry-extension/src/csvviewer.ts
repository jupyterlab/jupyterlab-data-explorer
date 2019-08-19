import { DataGrid } from "@phosphor/datagrid";
import { DSVModel } from "@jupyterlab/csvviewer";
import {
  JupyterFrontEndPlugin,
  JupyterFrontEnd
} from "@jupyterlab/application";
import {
  Registry,
  DataTypeNoArgs,
  createConverter,
  textDataType,
  resolveExtensionConverter
} from "@jupyterlab/dataregistry";
import { widgetDataType } from "./widgets";
import { Observable, Subscription } from "rxjs";
import { RegistryToken } from "./registry";
import { Message } from "@phosphor/messaging";

export const CSVDataType = new DataTypeNoArgs<Observable<string>>("text/csv");

class MyDataGrid extends DataGrid {
  constructor(private _data: Observable<string>) {
    super();
    this.headerVisibility = "all";
  }
  onBeforeAttach(msg: Message) {
    this._subscription = this._data.subscribe(data => {
      if (this.model) {
        (this.model as DSVModel).dispose();
      }
      this.model = new DSVModel({ data, delimiter: "," });
    });
    super.onBeforeAttach(msg);
  }

  onBeforeDetach(msg: Message) {
    this._subscription && this._subscription.unsubscribe();
    super.onBeforeDetach(msg);
  }
  private _subscription?: Subscription;
}

const id = "@jupyterlab/dataregistry-extension:csv-viewer";

export default {
  activate,
  id,
  requires: [RegistryToken],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(app: JupyterFrontEnd, registry: Registry): void {
  registry.addConverter(
    resolveExtensionConverter(".csv", "text/csv"),
    createConverter(
      { from: textDataType, to: CSVDataType },
      ({ data, type }) => {
        if (type === "text/csv") {
          return { data, type: undefined };
        }
        return null;
      }
    ),
    createConverter({ from: CSVDataType, to: widgetDataType }, ({ data }) => ({
      type: "Grid",
      data: () => new MyDataGrid(data)
    }))
  );
}
