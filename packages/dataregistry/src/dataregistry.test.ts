import { Dataset } from './dataset';
import registry from './dataregistry';
import { JSONObject } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';

describe('dataregistry', () => {
  interface IInMemoryCSV extends JSONObject {
    value: string;
  }

  interface ICSVMetadata extends JSONObject {
    delimiter: string;
    lineDelimiter: string;
  }
  const CSV_CONTENT = 'header1,header2\nvalue1,value2';
  const datasetId = '1234567890';

  interface IS3CSV extends JSONObject {
    value: null;
  }

  interface IS3CSVMetadata extends ICSVMetadata {
    iamRoleArn: string;
  }

  describe('#registerDataset', () => {
    it('should register a dataset', () => {
      registry.registerDataset<IInMemoryCSV, ICSVMetadata>({
        id: datasetId,
        abstractDataType: 'tabular',
        serializationType: 'csv',
        storageType: 'inmemory',
        value: {
          value: CSV_CONTENT,
        },
        metadata: {
          delimiter: ',',
          lineDelimiter: '\n',
        },
        title: 'CSV In Memory Dataset',
        description: 'Dummy in memory dataset',
        version: '1.0',
      });
    });

    it('should throw an error for an existing dataset', () => {
      expect(() => {
        registry.registerDataset<IInMemoryCSV, ICSVMetadata>({
          id: datasetId,
          abstractDataType: 'tabular',
          serializationType: 'csv',
          storageType: 'inmemory',
          value: {
            value: CSV_CONTENT,
          },
          metadata: {
            delimiter: ',',
            lineDelimiter: '\n',
          },
          title: 'CSV In Memory Dataset',
          description: 'Dummy in memory dataset',
        });
      }).toThrowError(/already exists/);
    });
  });

  describe('#updateDataset', () => {
    it('should update an existing dataset', () => {
      registry.updateDataset<IInMemoryCSV, ICSVMetadata>({
        id: datasetId,
        abstractDataType: 'tabular',
        serializationType: 'csv',
        storageType: 'inmemory',
        value: {
          value: CSV_CONTENT,
        },
        metadata: {
          delimiter: ',',
          lineDelimiter: '\n',
        },
        title: 'CSV In Memory Dataset',
        description: 'Dummy in memory dataset',
        version: '2.0',
      });
    });

    it("should throw an error when abstract data type doesn't match", () => {
      expect(() => {
        registry.updateDataset<IInMemoryCSV, ICSVMetadata>({
          id: datasetId,
          abstractDataType: 'text',
          serializationType: 'text',
          storageType: 'inmemory',
          value: {
            value: CSV_CONTENT,
          },
          metadata: {
            delimiter: ',',
            lineDelimiter: '\n',
          },
          title: 'CSV In Memory Dataset',
          description: 'Dummy in memory dataset',
        });
      }).toThrowError(/doesn't match/);
    });

    it("should throw an error when serialization type doesn't match", () => {
      expect(() => {
        registry.updateDataset<IInMemoryCSV, ICSVMetadata>({
          id: datasetId,
          abstractDataType: 'text',
          serializationType: 'text',
          storageType: 'inmemory',
          value: {
            value: CSV_CONTENT,
          },
          metadata: {
            delimiter: ',',
            lineDelimiter: '\n',
          },
          title: 'CSV In Memory Dataset',
          description: 'Dummy in memory dataset',
        });
      }).toThrowError(/doesn't match/);
    });

    it("should throw an error when storage type doesn't match", () => {
      expect(() => {
        registry.updateDataset<IInMemoryCSV, ICSVMetadata>({
          id: datasetId,
          abstractDataType: 'tabular',
          serializationType: 'csv',
          storageType: 's3',
          value: {
            value: CSV_CONTENT,
          },
          metadata: {
            delimiter: ',',
            lineDelimiter: '\n',
          },
          title: 'CSV In Memory Dataset',
          description: 'Dummy in memory dataset',
        });
      }).toThrowError(/doesn't match/);
    });
  });

  describe('#getDataset', () => {
    it('should return the last registered version of the dataset', () => {
      const dataset: Dataset<IInMemoryCSV, ICSVMetadata> =
        registry.getDataset(datasetId);
      expect(dataset.version).toEqual('2.0');
    });

    it('should return the dataset corresponding to the version no passed', () => {
      const dataset: Dataset<IInMemoryCSV, ICSVMetadata> = registry.getDataset(
        datasetId,
        '1.0'
      );
      expect(dataset.version).toEqual('1.0');
    });
  });

  describe('#hasDataset', () => {
    it('should return false if dataset is not registered', () => {
      expect(registry.hasDataset('s3://bucket/key')).toBeFalsy();
    });

    it('should return true if dataset is registered', () => {
      expect(registry.hasDataset(datasetId)).toBeTruthy();

      registry.registerDataset<IS3CSV, IS3CSVMetadata>({
        id: 's3://bucket/object',
        abstractDataType: 'tabular',
        serializationType: 'csv',
        storageType: 's3',
        value: {
          value: null,
        },
        metadata: {
          delimiter: ',',
          lineDelimiter: '\n',
          iamRoleArn: 'arn:aws:iam::account-id:role/role-name',
        },
        title: 'CSV S3 Dataset',
        description: 'CSV in S3 dataset',
        version: '1.0',
      });

      expect(registry.hasDataset('s3://bucket/object')).toBeTruthy();
    });
  });

  describe('#getDatasetSignal', () => {
    it('should return the signal attached to a registered dataset', () => {
      const signal: Signal<
        any,
        Dataset<IS3CSV, IS3CSVMetadata>
      > = registry.getDatasetSignal('s3://bucket/object');
      expect(signal).toBeInstanceOf(Signal);
    });

    it('should return the same signal even when dataset is updated', () => {
      const signalA: Signal<
        any,
        Dataset<IS3CSV, IS3CSVMetadata>
      > = registry.getDatasetSignal('s3://bucket/object');
      registry.updateDataset<IS3CSV, IS3CSVMetadata>({
        id: 's3://bucket/object',
        abstractDataType: 'tabular',
        serializationType: 'csv',
        storageType: 's3',
        value: {
          value: null,
        },
        metadata: {
          delimiter: ',',
          lineDelimiter: '\n',
          iamRoleArn: 'arn:aws:iam::account-id:role/role-name',
        },
        title: 'CSV S3 Dataset',
        description: 'CSV in S3 dataset',
        version: '2.0',
      });
      const signalB: Signal<
        any,
        Dataset<IS3CSV, IS3CSVMetadata>
      > = registry.getDatasetSignal('s3://bucket/object');
      expect(signalB).toBe(signalA);
    });

    it('should throw an error if dataset is not registered', () => {
      expect(() => {
        registry.getDatasetSignal('');
      }).toThrowError();
    });
  });
});
