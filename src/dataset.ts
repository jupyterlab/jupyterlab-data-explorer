import { JSONValue } from '@lumino/coreutils';

export interface Dataset<T extends JSONValue, U extends JSONValue> {
  /**
   * Unique identifier for the dataset, for in-memory
   * datasets, a unique uuid might be provided.
   * This id should be unique across a jupyter server instance.
   */
  id: string;
  /**
   * Abstract data type for the dataset, e.g.,
   * tabular, image, text, tabular collection
   */
  abstractDataType: string;
  /**
   * Serialization type for the dataset e.g.,
   * csv, jpg
   */
  serializationType: string;
  /**
   * Storage type for the dataset e.g.,
   * inmemory, file, s3
   */
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
  tags?: Set<string>;
  version?: string;
}
