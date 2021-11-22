import { DatasetListComponent } from './dataset-list';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import React from 'react';
import { DatasetSearchComponent } from './dataset-search';
import { DatasetAddComponent } from './dataset-add';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IDatasetListingModel } from './model';

export class DatasetPanel extends ReactWidget {
  readonly _title?: string;
  readonly _description?: string;
  readonly _notebookTracker?: INotebookTracker;
  readonly _app?: JupyterFrontEnd;
  readonly _model: IDatasetListingModel;
  constructor(options: DatasetPanel.IOptions) {
    super();
    this.addClass('jp-dataset-panel');
    this.id = 'dataset-panel';
    this._title = options.title ?? 'Data Panel';
    this._description =
      options.description ??
      'Add and view data associated with your notebooks.';
    this._model = options.model;
  }

  render(): JSX.Element {
    return (
      <div>
        <h2>{this._title}</h2>
        <p>{this._description}</p>
        <DatasetSearchComponent />
        <DatasetAddComponent onClick={(e: any) => console.log(e)} />
        <UseSignal signal={this._model.datasetsChanged}>
          {() => <DatasetListComponent model={this._model} />}
        </UseSignal>
      </div>
    );
  }
}

namespace DatasetPanel {
  export interface IOptions {
    title?: string;
    description?: string;
    model: IDatasetListingModel;
  }
}
