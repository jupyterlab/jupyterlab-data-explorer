import React from 'react';
import { Dataset } from '@jupyterlab/dataregistry';
import { IDatasetListingModel } from './model';

/**
 * React component for the dataset list
 * @constructor
 */
export const DatasetListComponent = (
  options: DatasetList.IOptions
): JSX.Element => {
  const onContextMenu = (dataset: Dataset<any, any>) => {
    options.model.selectedDataset = dataset;
  };

  return (
    <div>
      <table className={'jp-Dataset-list'}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Storage</th>
          </tr>
        </thead>
        <tbody>
          {options.model.datasets().map((dataset) => {
            return (
              <tr
                className={`jp-Dataset-list-item`}
                data-dataset-id={dataset.id}
                data-adt={dataset.abstractDataType}
                data-sert={dataset.serializationType}
                data-stot={dataset.storageType}
                key={dataset.id}
                onContextMenu={(e) => onContextMenu(dataset)}
              >
                <td>{dataset.title}</td>
                <td>{dataset.abstractDataType}</td>
                <td>{dataset.storageType}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

namespace DatasetList {
  export interface IOptions {
    model: IDatasetListingModel;
  }
}
