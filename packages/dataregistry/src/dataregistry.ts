import { JSONObject } from './json';
import { Dataset } from './dataset';

const DatasetStore: { [key: string]: Dataset<any, any>[] } = {};

const registry = {
  /**
   * Registers a dataset, throws an exception if dataset already exists.
   * Pass in a version to register an updated version of the dataset.
   * @param dataset
   */
  registerDataset<T extends JSONObject, U extends JSONObject>(
    dataset: Dataset<T, U>
  ) {
    if (this.hasDataset<T, U>(dataset.id, dataset.version)) {
      throw new Error(
        `Dataset with id: ${dataset.id}, version: ${dataset.version} already exists.`
      );
    } else {
      dataset.version = dataset.version ?? 0;
      if (!DatasetStore[dataset.id]) {
        DatasetStore[dataset.id] = [dataset];
      } else {
        DatasetStore[dataset.id] = [...DatasetStore[dataset.id], dataset];
      }
      // TODO: hook in here to emit version change callbacks
    }
  },

  /**
   * Returns last registered version of dataset if no version is passed
   * @param id unique id dataset was registered with
   * @param version optional, specific dataset version
   */
  getDataset<T extends JSONObject, U extends JSONObject>(
    id: string,
    version?: number
  ): Dataset<T, U> {
    const datasets = DatasetStore[id];
    if (!datasets) {
      throw new Error(`No dataset with id: ${id} exists.`);
    } else if (version != null && datasets.length <= version) {
      throw new Error(`No dataset with id: ${id}, version: ${version} exists.`);
    }
    return DatasetStore[id][version ?? datasets.length - 1];
  },

  /**
   * Returns true if dataset exists, false otherwise
   * @param id unique id that was used to register the dataset
   * @param version version that dataset was registered with (optional, defaults to 0)
   */
  hasDataset<T extends JSONObject, U extends JSONObject>(
    id: string,
    version: number = 0
  ): boolean {
    const datasets = DatasetStore[id];
    return datasets && datasets.length > version;
  },

  /* TODO: Placeholder to query datasets by datatype, serialization type and storage type */
  queryDataset() {},

  /* TODO: Placeholder for registering actions with a dataset, explore jupyterlab command interface */
  registerAction() {},
};

export default registry;
