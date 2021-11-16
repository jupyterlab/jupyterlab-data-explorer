import { Dataset } from '@jupyterlab/dataregistry';
import { ISignal, Signal } from '@lumino/signaling';
import registry from '@jupyterlab/dataregistry/lib/dataregistry';

export class Model implements IModel {
  constructor() {}

  get dataset(): Dataset<any, any> {
    return this._dataset!;
  }

  get datasetChanged(): ISignal<this, Dataset<any, any>> {
    return this._datasetChanged;
  }

  set dataset(value: Dataset<any, any>) {
    if (this._dataset.id === value.id) {
      return;
    }
    this._dataset = value;
    this._datasetChanged.emit(this._dataset);
  }

  private _dataset: Dataset<any, any> = {
    id: '',
    storageType: '',
    abstractDataType: '',
    serializationType: '',
    value: null,
    metadata: {},
    title: '',
    description: '',
  };

  private _datasetChanged = new Signal<this, Dataset<any, any>>(this);
}

export interface IModel {
  dataset: Dataset<any, any>;
  datasetChanged: ISignal<IModel, Dataset<any, any>>;
}

export class DatasetListingModel implements IDatasetListingModel {
  private _datasets: Dataset<any, any>[];
  private _filter?: IDatasetFilter;

  constructor(datasets: Dataset<any, any>[]) {
    this._datasets = datasets;
    registry.datasetAdded.connect(this._addDataset);
    registry.datasetUpdated.connect(this._updateDataset);
    registry.commandAdded.connect(this._commandAdded);
  }

  _addDataset(dataset: Dataset<any, any>) {
    this._datasets.push(dataset);
    // notify
  }

  _updateDataset(dataset: Dataset<any, any>) {
    const index = this._datasets.findIndex(({ id }) => dataset.id === id);
    if (index !== -1) {
      this._datasets[index] = dataset;
      // notify
    }
  }

  _commandAdded(commandId: string) {}

  set filter(value: IDatasetFilter) {
    if (!this._filter || this._filter.value !== value.value) {
      this._filter = value;
      // update the
    }
  }

  datasets(): Dataset<any, any>[] {
    if (this._filter && this._filter.value) {
      const value = this._filter.value;
      return this._datasets.filter(
        (dataset) => dataset.title.indexOf(value) !== -1
      );
    } else {
      return [...this._datasets];
    }
  }
}

interface IDatasetListingModel {
  selectedDataset?: Dataset<any, any>;
  filter: IDatasetFilter;
}

interface IDatasetFilter {
  value: string;
  qualifier?: 'title' | 'adt' | 'sert' | 'stot';
}
