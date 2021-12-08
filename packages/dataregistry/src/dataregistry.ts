import { Dataset } from './dataset';
import { JSONValue, Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';

const DatasetStore: { [key: string]: Dataset<any, any>[] } = {};
const CommandsStore: { [key: string]: Set<string> } = {};
const SignalsStore: { [key: string]: Signal<any, any> } = {};

export interface IDataRegistry {
  registerDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ): void;

  updateDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ): void;

  getDataset<T extends JSONValue, U extends JSONValue>(
    id: string,
    version?: string
  ): Dataset<T, U>;

  getDatasetSignal<T extends JSONValue, U extends JSONValue>(
    id: string
  ): Signal<any, Dataset<T, U>>;

  hasDataset<T extends JSONValue, U extends JSONValue>(
    id: string,
    version?: string
  ): boolean;

  registerCommand(
    commandId: string,
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): void;

  getCommands(
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): Set<string> | [];

  queryDataset(
    abstractDataType?: string,
    serializationType?: string,
    storageType?: string
  ): Dataset<any, any>[] | [];

  readonly datasetAdded: Signal<any, Dataset<any, any>>;
  readonly datasetUpdated: Signal<any, Dataset<any, any>>;
  readonly commandAdded: Signal<any, String>;
}

class Registry implements IDataRegistry {
  readonly datasetAdded: Signal<any, Dataset<any, any>>;
  readonly datasetUpdated: Signal<any, Dataset<any, any>>;
  readonly commandAdded: Signal<any, String>;

  constructor() {
    this.datasetAdded = new Signal(this);
    this.datasetUpdated = new Signal(this);
    this.commandAdded = new Signal(this);
  }

  /**
   * Registers a dataset, throws an exception if dataset already exists.
   * @param dataset The dataset to register
   */
  registerDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ) {
    _registerDataset(dataset);
    this.datasetAdded.emit(dataset);
  }

  /**
   * Updates a registered dataset, bumps up the version
   * @param dataset The dataset to update
   */
  updateDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ) {
    const registeredDataset = this.getDataset(dataset.id);
    if (registeredDataset) {
      if (registeredDataset.abstractDataType !== dataset.abstractDataType) {
        throw new Error(
          `Abstract data type "${dataset.abstractDataType}" doesn't match "${registeredDataset.abstractDataType}"`
        );
      }
      if (registeredDataset.serializationType !== dataset.serializationType) {
        throw new Error(
          `Serialization type "${dataset.serializationType}" doesn't match "${registeredDataset.serializationType}"`
        );
      }
      if (registeredDataset.storageType !== dataset.storageType) {
        throw new Error(
          `Storage type "${dataset.storageType}" doesn't match "${registeredDataset.storageType}"`
        );
      }
      _registerDataset(dataset);
      this.getDatasetSignal(dataset.id).emit(dataset);
      this.datasetUpdated.emit(dataset);
    }
  }

  /**
   * Returns last registered version of dataset if no version is passed
   * @param id unique id dataset was registered with
   * @param version optional, specific dataset version
   */
  getDataset<T extends JSONValue, U extends JSONValue>(
    id: string,
    version?: string
  ): Dataset<T, U> {
    const datasets = DatasetStore[id];
    if (!datasets) {
      throw new Error(`No dataset with id: ${id} exists.`);
    } else if (version) {
      const dataset = datasets.find((dataset) => dataset.version === version);
      if (dataset) {
        return dataset;
      } else {
        throw new Error(
          `No dataset with id: ${id}, version: ${version} exists.`
        );
      }
    }
    return datasets[datasets.length - 1];
  }

  /**
   * Returns dataset signal for subscribing to changes in dataset
   * @param id unique id used to register the dataset
   */
  getDatasetSignal<T extends JSONValue, U extends JSONValue>(
    id: string
  ): Signal<any, Dataset<T, U>> {
    if (this.hasDataset(id)) {
      return SignalsStore[id];
    } else {
      throw new Error(`No dataset registered with id: ${id}`);
    }
  }

  /**
   * Returns true if dataset exists, false otherwise
   * @param id unique id that was used to register the dataset
   * @param version version that dataset was registered with (optional, defaults to 0)
   */
  hasDataset<T extends JSONValue, U extends JSONValue>(
    id: string,
    version?: string
  ): boolean {
    const datasets = DatasetStore[id];
    return (
      datasets &&
      (version
        ? datasets.findIndex((ds) => ds.version === version) !== -1
        : true)
    );
  }

  /**
   * Registers a command for an abstract data type, serialization type,
   * and storage type. This can be used to get a list of commands that
   * that a dataset can support.
   * @param commandId unique id of the command registered with the command registry
   * @param abstractDataType
   * @param serializationType
   * @param storageType
   */
  registerCommand(
    commandId: string,
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): void {
    const key = `${abstractDataType}:${serializationType}:${storageType}`;
    const actions = CommandsStore[key] || new Set();
    CommandsStore[key] = actions.add(commandId);
    this.commandAdded.emit(commandId);
  }

  /**
   * Get list of registered commands
   * @param abstractDataType
   * @param serializationType
   * @param storageType
   */
  getCommands(
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): Set<string> | [] {
    return (
      CommandsStore[
        `${abstractDataType}:${serializationType}:${storageType}`
      ] || []
    );
  }

  /**
   * Returns datasets that match the passed abstract data type,
   * serialization type, and storage type.
   * @param abstractDataType
   * @param serializationType
   * @param storageType
   */
  queryDataset(
    abstractDataType?: string,
    serializationType?: string,
    storageType?: string
  ): Dataset<any, any>[] | [] {
    const datasets = [];
    for (const id in DatasetStore) {
      const versions = DatasetStore[id];
      const dataset = versions[versions.length - 1];
      let include = true;
      if (abstractDataType) {
        include = dataset.abstractDataType === abstractDataType;
      }
      if (serializationType) {
        include = include && dataset.serializationType === serializationType;
      }
      if (storageType) {
        include = include && dataset.storageType === storageType;
      }
      if (include) {
        datasets.push(dataset);
      }
    }
    return datasets;
  }
}

const registry = new Registry();

console.log('Created a new registry');

function _registerDataset<T extends JSONValue, U extends JSONValue>(
  dataset: Dataset<T, U>
) {
  if (registry.hasDataset<T, U>(dataset.id, dataset.version)) {
    throw new Error(
      `Dataset with id: ${dataset.id}, version: ${dataset.version} already exists.`
    );
  } else {
    if (!DatasetStore[dataset.id]) {
      DatasetStore[dataset.id] = [dataset];
      SignalsStore[dataset.id] = new Signal<any, Dataset<T, U>>(registry);
    } else {
      DatasetStore[dataset.id] = [...DatasetStore[dataset.id], dataset];
    }
  }
}

export const IDataRegistry = new Token<IDataRegistry>(
  '@jupyterlab/dataregistry:IDataRegistry'
);

export default registry;