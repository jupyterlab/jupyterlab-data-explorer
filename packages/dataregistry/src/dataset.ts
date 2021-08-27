import { JSONObject } from './json';

export interface Dataset<T extends JSONObject, U extends JSONObject> {
  /**
   * Unique identifier for the dataset, for in-memory
   * datasets, a unique uuid might be provided.
   * This id should be unique across a jupyter server instance.
   */
  id: string;
  abstractDataType: string;
  serializationType: string;
  storageType: string;
  /**
   * Output value for the dataset
   */
  value: T;
  /**
   * Additional properties for the dataset
   * that help serialize or query data
   */
  metadata: U;
  title: string;
  description: string;
  tags?: { [key: string]: string };
  version?: number;
}
