import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { Dataset } from '@jupyterlab/dataregistry';

/**
 * React component for the dataset list
 * @constructor
 */
export const DatasetListComponent = (
  options: DatasetList.IOptions
): JSX.Element => {
  const onClick = (dataset: Dataset<any, any>) => {
    if (options.onClick) {
      options.onClick(dataset);
    }
  };
  return (
    <div>
      <ul>
        {options.datasets.map((dataset) => {
          return (
            <li key={dataset.id} onClick={(e) => onClick(dataset)}>
              <span>{dataset.title}</span>
              <span>
                {dataset.abstractDataType}, {dataset.serializationType},
                {dataset.storageType}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Widget to display the datasets in list format
 */
export class DatasetList extends ReactWidget {
  readonly _datasets: Dataset<any, any>[];
  constructor(options: DatasetList.IOptions) {
    super();
    this.addClass('jp-dataset-list');
    this._datasets = options.datasets;
  }

  render(): JSX.Element {
    return <DatasetListComponent datasets={this._datasets} />;
  }
}

namespace DatasetList {
  export interface IOptions {
    datasets: Dataset<any, any>[];
    onClick?: Function;
  }
}
