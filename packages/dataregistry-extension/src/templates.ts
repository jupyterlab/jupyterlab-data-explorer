import { Dataset } from '@jupyterlab/dataregistry';

const InMemoryCsvTemplate = (dataset: Dataset<any, any>): String[] => {
  const value = dataset.value.replace(/\n/g, '\\n');
  return [
    'import pandas as pd',
    'from io import StringIO',
    '',
    `df = pd.read_csv(StringIO(\'${value}\'))`,
    'df.head()',
  ];
};

const S3CsvTemplate = (dataset: Dataset<any, any>): String[] => {
  return [
    'import boto3',
    'import pandas as pd',
    'from io import BytesIO',
    '',
    "s3 = boto3.resource('s3')",
    `obj = s3.Object(\'${dataset.metadata.bucket}\', \'${dataset.metadata.filename}\')`,
    "with BytesIO(obj.get()['Body'].read()) as bio:",
    '    df = pd.read_csv(bio)',
    '    df.head()',
  ];
};

const HuggingFaceTemplate = (dataset: Dataset<any, any>): String[] => {
  return [
    'from datasets import load_dataset',
    '',
    `ds = load_dataset(\'${dataset.metadata.name}\', \'${dataset.metadata.config}\', split=\'${dataset.metadata.split}\')`,
  ];
};

export const getTemplate = (dataset: Dataset<any, any>) => {
  const { storageType, serializationType } = dataset;
  if (storageType === 'inmemory' && serializationType === 'csv') {
    return InMemoryCsvTemplate(dataset).join('\n');
  } else if (storageType === 's3' && serializationType === 'csv') {
    return S3CsvTemplate(dataset).join('\n');
  } else if (storageType === 'huggingface') {
    return HuggingFaceTemplate(dataset).join('\n');
  } else {
    throw new Error(
      `Template not found for ${storageType}, ${serializationType}`
    );
  }
};

export const getCreateTemplate = () => {
  const tpl = [
    'from dataregistry import dataset',
    'ds = dataset.Dataset(',
    '    id="0",',
    '    abstract_data_type="tabular",',
    '    serialization_type="tsv",',
    '    storage_type="immemory",',
    '    title="In memory dataset from python",',
    '    description="In memory dataset from python",',
    '    value="header1\\theader2\\nvalue1\\tvalue2",',
    '    metadata={',
    '        "delimiter": "\\t",',
    '        "lineDemiliter": "\\n"',
    '    }',
    ')',
  ];
  return tpl.join('\n');
};
