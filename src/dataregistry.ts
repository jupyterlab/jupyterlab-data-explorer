import { Dataset } from './dataset';
import { JSONValue, Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { DataRegistryHandler } from './handler';
import { Poll } from '@lumino/polling';

const SignalsStore: { [key: string]: Signal<any, any> } = {};
const DatasetsStore: { [key: string]: Dataset<any, any>[] } = {};
const CommandsStore: { [key: string]: string[] } = {};


export interface IDataRegistry {
  registerDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ): Promise<void>;

  updateDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ): Promise<void>;

  getDataset<T extends JSONValue, U extends JSONValue>(
    id: string,
    version?: string
  ): Promise<Dataset<T, U>>;

  getDatasetSignal<T extends JSONValue, U extends JSONValue>(
    id: string
  ): Signal<any, Dataset<T, U>>;

  hasDataset(
    id: string,
    version?: string
  ): Promise<boolean>;

  registerCommand(
    commandId: string,
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): Promise<void>;

  getCommands(
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): Promise<Set<string> | []>;

  queryDataset(
    abstractDataType?: string,
    serializationType?: string,
    storageType?: string
  ): Promise<Dataset<any, any>[]> | Promise<[]>;

  loadDatasets(): void
  loadCommands(): void
  dispose(): void

  readonly datasetAdded: Signal<any, Dataset<any, any>>;
  readonly datasetUpdated: Signal<any, Dataset<any, any>>;
  readonly commandAdded: Signal<any, string>;
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
  readonly commandAdded: Signal<any, string>;

  private readonly _registryService: DataRegistryHandler;
  private readonly _poll: Poll

  constructor() {
    this.datasetAdded = new Signal(this);
    this.datasetUpdated = new Signal(this);
    this.commandAdded = new Signal(this);
    this._registryService = new DataRegistryHandler({});
    this._poll = new Poll({
      factory: async () => {
        await this.loadDatasets();
        await this.loadCommands();
      },
      frequency: { interval: 10000, backoff: false }
    });
    this._poll.start();
  }

  /**
   * Registers a dataset. Use {@link Registry#updateDataset}
   * to update a registered dataset.
   *
   * @param dataset The dataset to register
   * @throws Throws an error if dataset with
   * same id and version already exists.
   */
  async registerDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ) {
    const registeredDataset = await this._registryService.registerDataset(dataset);
    DatasetsStore[dataset.id] = [dataset];
    if(registeredDataset != null) {
      SignalsStore[dataset.id] = new Signal<any, Dataset<T, U>>(registry);
      this.datasetAdded.emit(dataset);
    }
  }

  /**
   * Updates a registered dataset, bumps up the version.
   *
   * @param dataset The dataset to update
   * @throws Throws an exception if any of abstractDataType,
   * serializationType or storageType are different from
   * registered values.
   */
  async updateDataset<T extends JSONValue, U extends JSONValue>(
    dataset: Dataset<T, U>
  ) {
    const registeredDataset = await this._registryService.updateDataset(dataset);
    DatasetsStore[dataset.id].push(dataset);
    if(registeredDataset != null) {
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
  async getDataset<T extends JSONValue, U extends JSONValue>(
    id: string,
    version?: string
  ): Promise<Dataset<T, U>> {
    const datasets = DatasetsStore[id];
    if(!datasets) {
      throw new Error(`Dataset with id ${id} is not registered.`);
    }
    const dataset = datasets.find((ds) => ds.version != null && ds.version === version)
    if(version && !dataset) {
      throw new Error(`Dataset with id:${id} and version: ${version} is not registered.`);
    }
    return dataset!!;
    
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
    if (SignalsStore[id]) {
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
  async hasDataset(
    id: string,
    version?: string
  ): Promise<boolean> {
    const datasets = DatasetsStore[id];
    if(!datasets) {
      return false;
    }
    const dataset = datasets.find((ds) => ds.version != null && ds.version === version)
    if(version && !dataset) {
      return false;
    }
    return true;
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
  async registerCommand(
    commandId: string,
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): Promise<void> {
    const data = await this._registryService.registerCommand(commandId, abstractDataType, serializationType, storageType);
    const key = `${abstractDataType}_${serializationType}_${storageType}`;
    if(CommandsStore[key]) {
      CommandsStore[key].push(commandId);
    } else {
      CommandsStore[key] = [commandId];
    }
    if(data != null){
      this.commandAdded.emit(commandId);
    }
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
  async getCommands(
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ): Promise<Set<string> | []> {
    const key = `${abstractDataType}_${serializationType}_${storageType}`;
    return new Set(CommandsStore[key]) || [];
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
  async queryDataset(
    abstractDataType?: string,
    serializationType?: string,
    storageType?: string
  ): Promise<Dataset<any, any>[] | []> {
    const all_datasets = [];
    for (const id in DatasetsStore) {
      const datasets = DatasetsStore[id]; 
      const dataset = datasets[datasets.length - 1];
      let include = true;
      if(abstractDataType) {
        include = dataset.abstractDataType === abstractDataType;
      }
      if(serializationType) {
        include = include && dataset.serializationType === serializationType;
      }
      if(storageType) {
        include = include && dataset.storageType === storageType;
      }
      if(include) {
        all_datasets.push(dataset);
      }
    }
    
    return all_datasets;
  }

  /**
   * Loads all the datasets from the server
   */
  async loadDatasets() {
    const all_datasets = await this._registryService.queryDataset();
    for(const dataset of all_datasets) {
      const id = dataset.id;
      if (DatasetsStore[id]) {
        const datasets = DatasetsStore[id];
        const localDataset = datasets[datasets.length - 1];
        if(dataset.version != null && dataset.version != localDataset.version) {
          DatasetsStore[id].push(dataset);
          this.getDatasetSignal(dataset.id).emit(dataset);
          this.datasetUpdated.emit(dataset);
        }
      } else {
        DatasetsStore[id] = [dataset];
        SignalsStore[dataset.id] = new Signal<any, Dataset<any, any>>(registry);
        this.datasetAdded.emit(dataset);
      } 
    }
  }

  /**
   * Loads all commands from server
   */
  async loadCommands() {
    const allCommands = await this._registryService.loadCommands();
    for(const key in allCommands) {
      const localCommands = CommandsStore[key];
      const commands = allCommands[key];
      if(localCommands) {
        const missing = commands.filter(c => !localCommands.includes(c))
        if(missing.length > 0) {
          CommandsStore[key] = [...localCommands, ...missing]
          for(const command of missing) {
            this.commandAdded.emit(command);
          }
        }
      } else {
        CommandsStore[key] = commands;
        for(const command of commands) {
          this.commandAdded.emit(command);
        }
      }
    }
  }

  dispose() {
    this._poll.dispose();
  }

}

const registry = new Registry();

export const IDataRegistry = new Token<IDataRegistry>(
  '@jupyterlab/dataregistry:IDataRegistry'
);

export default registry;
