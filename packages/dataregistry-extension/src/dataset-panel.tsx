import { DatasetListComponent } from './dataset-list';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import React from 'react';
import { DatasetSearchComponent } from './dataset-search';
import { DatasetAddComponent } from './dataset-add';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IDatasetListingModel } from './model';
import { CommandIds } from './commands';

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
    this._title = options.title ?? 'Datasets';
    this._description =
      options.description ??
      'Add and view data associated with your notebooks.';
    this._model = options.model;
    this._app = options.app;
  }

  handleAdd(e: any) {
    if (this._app) {
      this._app.commands.execute(CommandIds.create);
    }
  }

  render(): JSX.Element {
    return (
      <div>
        <div className="jp-dataset-header">
          <h2>{this._title}</h2>
          <p>{this._description}</p>
        </div>
        <div className="jp-dataset-search">
          <DatasetSearchComponent model={this._model} />
          <DatasetAddComponent onClick={(e: any) => this.handleAdd(e)} />
        </div>
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
    app: JupyterFrontEnd;
  }
}
