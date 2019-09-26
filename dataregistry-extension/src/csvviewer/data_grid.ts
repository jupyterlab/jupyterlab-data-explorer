/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { Observable, Subscription } from "rxjs";
import { DataGrid } from "@phosphor/datagrid";
import { Message } from "@phosphor/messaging";
import { DSVModel } from "@jupyterlab/csvviewer";

/**
 * Class to support the conversion from CSV data to data grid widget data.
 *
 * @private
 */
class CSVDataGrid extends DataGrid {
  private _data: Observable<string>;
  private _subscription?: Subscription;

  /**
   * Constructor.
   *
   * @param data - CSV data as an observable
   * @returns class instance
   */
  constructor(data: Observable<string>) {
    super();
    this._data = data;
    this.headerVisibility = "all";
  }

  /**
   * Callback invoked upon receiving a `'before-attach'` message.
   *
   * @param msg - message
   */
  protected onBeforeAttach(msg: Message) {
    const self = this;
    this._subscription = this._data.subscribe(onData);
    super.onBeforeAttach(msg);

    /**
     * Callback invoked upon changes to the CSV data.
     *
     * @private
     * @param data - CSV data
     */
    function onData(data: string) {
      if (self.model) {
        (self.model as DSVModel).dispose();
      }
      self.model = new DSVModel({
        "data": data,
        "delimiter": ","
      });
    }
  }

  /**
   * Callback invoked upon receiving a `'before-detach'` message.
   *
   * @param msg - message
   */
  protected onBeforeDetach(msg: Message) {
    this._subscription && this._subscription.unsubscribe();
    super.onBeforeDetach(msg);
  }
}

/**
 * Exports.
 */
export default CSVDataGrid;