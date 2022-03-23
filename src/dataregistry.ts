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
  /**
   * This signal provides subscriptions to
   * any datasets added to registry.
   */
  readonly datasetAdded: Signal<any, Dataset<any, any>>;

  /**
   * This signal provides subscriptions to
   * any updates to datasets.
   */
  readonly datasetUpdated: Signal<any, Dataset<any, any>>;

  /**
   * This signal provides subscriptions to
   * event when any command is registered.
   */
  readonly commandAdded: Signal<any, String>;

  constructor() {
    this.datasetAdded = new Signal(this);
    this.datasetUpdated = new Signal(this);
    this.commandAdded = new Signal(this);
  }

  /**
   * Registers a dataset. Use {@link Registry#updateDataset}
   * to update a registered dataset.
   *
   * @param dataset The dataset to register
   * @throws Throws an error if dataset with
   * same id and version already exists.
   */
  registerDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ) {
    _registerDataset(dataset);
    this.datasetAdded.emit(dataset);
  }

  /**
   * Updates a registered dataset, bumps up the version.
   *
   * @param dataset The dataset to update
   * @throws Throws an exception if any of abstractDataType,
   * serializationType or storageType are different from
   * registered values.
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
   * Returns last registered version of dataset if no version is passed.
   *
   * @param id unique id dataset was registered with
   * @param version optional, specific dataset version
   * @returns Dataset dataset
   * @throws  Will throw an error if no matching dataset found
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
   * See {@link https://jupyterlab.github.io/lumino/signaling/classes/signal.html|Signal}
   * to learn more about use of signals to subscribe to changes in dataset.
   *
   * @param id unique id used to register the dataset
   * @returns {@link https://jupyterlab.github.io/lumino/signaling/classes/signal.html|Signal} signal instance associated with dataset
   * @throws {Error} Will throw an error if
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
   *
   * @param id unique id that was used to register the dataset
   * @param version version that dataset was registered with
   * @returns {boolean} true if matching dataset exists
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
   * Registers a command for datasets with a set of abstract data type,
   * serialization type, and storage type. This is useful for extension
   * writers to associate specific dataset types with commands/actions
   * that their extensions support.
   *
   * @param commandId unique id of the command registered with the command registry
   * @param abstractDataType abstract data type
   * @param serializationType serialization type
   * @param storageType storage type
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
   * Get list of commands registered with a specific set of
   * abstract data type, serialization type, and storage type.
   * This is useful for extension writers to obtain only those commands
   * that have been previously registered with the dataset type.
   *
   * @param abstractDataType abstract data type
   * @param serializationType serialization type
   * @param storageType storage type
   * @returns {Set[string]|[]} set of registered commands
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
   * Returns list of datasets that match the passed abstract data type,
   * serialization type, and storage type.
   *
   * @param abstractDataType abstract data type to match
   * @param serializationType serialization type to match
   * @param storageType storage type to match
   * @returns {Dataset[]|[]} list of matching datasets
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
