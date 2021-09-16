import { Dataset } from '@jupyterlab/dataregistry';
import { DatasetListComponent } from './dataset-list';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { DatasetSearchComponent } from './dataset-search';
import { DatasetAddComponent } from './dataset-add';

export class DatasetPanel extends ReactWidget {
  readonly _datasets: Dataset<any, any>[];
  readonly _title?: string;
  readonly _description?: string;
  constructor(options: DatasetPanel.IOptions) {
    super();
    this.addClass('jp-dataset-panel');
    this.id = 'dataset-panel';
    this._datasets = options.datasets;
    this._title = options.title ?? 'Data Panel';
    this._description =
      options.description ??
      'Add and view data associated with your notebooks.';
  }

  render(): JSX.Element {
    return (
      <div>
        <h2>{this._title}</h2>
        <p>{this._description}</p>
        <DatasetSearchComponent />
        <DatasetAddComponent onClick={(e: any) => console.log(e)} />
        <DatasetListComponent datasets={this._datasets} />
      </div>
    );
  }
}

namespace DatasetPanel {
  export interface IOptions {
    title?: string;
    description?: string;
    datasets: Dataset<any, any>[];
  }
}
