/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { Observable, Subscription } from 'rxjs';
import {
  BasicKeyHandler,
  BasicMouseHandler,
  BasicSelectionModel,
  DataGrid,
} from '@lumino/datagrid';
import { Message } from '@lumino/messaging';
import { DSVModel } from '@jupyterlab/csvviewer';

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
    this.headerVisibility = 'all';
  }

  /**
   * Callback invoked upon receiving a `'before-attach'` message.
   *
   * @param msg - message
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);

    /**
     * Callback invoked upon changes to the CSV data.
     *
     * @private
     * @param data - CSV data
     */
    const onData = (data: string): void => {
      if (this.dataModel) {
        (this.dataModel as DSVModel).dispose();
      }
      this.dataModel = new DSVModel({
        data: data,
        delimiter: ',',
      });
      this.keyHandler = new BasicKeyHandler();
      this.mouseHandler = new BasicMouseHandler();
      this.selectionModel = new BasicSelectionModel({
        dataModel: this.dataModel,
      });
    };
    this._subscription = this._data.subscribe(onData);
  }

  /**
   * Callback invoked upon receiving a `'before-detach'` message.
   *
   * @param msg - message
   */
  protected onBeforeDetach(msg: Message): void {
    this._subscription && this._subscription.unsubscribe();
    super.onBeforeDetach(msg);
  }
}

/**
 * Exports.
 */
export default CSVDataGrid;
