/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

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
import { IRegistry } from "./registry";
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
  requires: [IRegistry],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(app: JupyterFrontEnd, registry: Registry): void {
  registry.addConverter(
    resolveExtensionConverter(".csv", "text/csv"),
    createConverter(
      { from: textDataType, to: CSVDataType },
      ({ data, type }) => {
        if (type === "text/csv") {
          return data
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
