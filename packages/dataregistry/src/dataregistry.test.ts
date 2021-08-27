import { JSONObject } from './json';
import { Dataset } from './dataset';
import registry from './dataregistry';

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

  describe('#registerDataset', () => {
    it('should register a dataset with no version passed', () => {
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

    it('should register a dataset with version passed', () => {
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
        version: 1,
      });
    });
  });

  describe('#getDataset', () => {
    it('should return the last registered version of the dataset', () => {
      const dataset: Dataset<IInMemoryCSV, ICSVMetadata> =
        registry.getDataset(datasetId);
      expect(dataset.version).toEqual(1);
    });

    it('should return the dataset corresponding to the version no passed', () => {
      const dataset: Dataset<IInMemoryCSV, ICSVMetadata> = registry.getDataset(
        datasetId,
        0
      );
      expect(dataset.version).toEqual(0);
    });
  });

  describe('#hasDataset', () => {
    it('should return false if dataset is not registered', () => {
      expect(registry.hasDataset('s3://bucket/key')).toBeFalsy();
    });

    it('should return true if dataset is registered', () => {
      expect(registry.hasDataset(datasetId)).toBeTruthy();

      interface IS3CSV extends JSONObject {
        value: null;
      }

      interface IS3CSVMetadata extends ICSVMetadata {
        iamRoleArn: string;
      }

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
      });

      expect(registry.hasDataset('s3://bucket/object')).toBeTruthy();
    });
  });
});
