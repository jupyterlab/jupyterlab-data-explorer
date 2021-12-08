import { Dataset } from '@jupyterlab/dataregistry';
import { Signal } from '@lumino/signaling';
import registry from '@jupyterlab/dataregistry/lib/dataregistry';

export class DatasetListingModel implements IDatasetListingModel {
  private _selectedDataset: Dataset<any, any> = {
    id: '',
    storageType: '',
    abstractDataType: '',
    serializationType: '',
    value: null,
    metadata: {},
    title: '',
    description: '',
  };
  private _datasets: Dataset<any, any>[];
  private _filter?: string;
  readonly datasetsChanged: Signal<any, any>;

  constructor(datasets: Dataset<any, any>[]) {
    this._datasets = datasets;
    registry.datasetAdded.connect(this._addDataset.bind(this));
    registry.datasetUpdated.connect(this._updateDataset.bind(this));
    registry.commandAdded.connect(this._commandAdded.bind(this));
    this.datasetsChanged = new Signal(this);
  }

  _addDataset(sender: any, dataset: Dataset<any, any>) {
    this._datasets.push(dataset);
    this.datasetsChanged.emit(null);
  }

  _updateDataset(dataset: Dataset<any, any>) {
    const index = this._datasets.findIndex(({ id }) => dataset.id === id);
    if (index !== -1) {
      this._datasets[index] = dataset;
      // notify
    }
  }

  _commandAdded(commandId: string) {}

  set filter(value: string) {
    if (!this._filter || this._filter !== value) {
      this._filter = value;
      this.datasetsChanged.emit(null);
    }
  }

  datasets(): Dataset<any, any>[] {
    if (this._filter && this._filter) {
      const value = this._filter.toLowerCase();
      return this._datasets.filter(
        (dataset) => dataset.title.toLowerCase().indexOf(value) !== -1
      );
    } else {
      return [...this._datasets];
    }
  }

  get selectedDataset(): Dataset<any, any> {
    return this._selectedDataset;
  }

  set selectedDataset(dataset: Dataset<any, any>) {
    if (this._selectedDataset.id === dataset.id) {
      return;
    }
    this._selectedDataset = dataset;
    this.datasetsChanged.emit(null);
  }
}

export interface IDatasetListingModel {
  selectedDataset?: Dataset<any, any>;
  filter: string;
  datasets(): Dataset<any, any>[];
  datasetsChanged: Signal<any, any>;
}
