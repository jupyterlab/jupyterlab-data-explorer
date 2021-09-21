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

export const getTemplate = (dataset: Dataset<any, any>) => {
  const { storageType, serializationType } = dataset;
  if (storageType === 'inmemory' && serializationType === 'csv') {
    return InMemoryCsvTemplate(dataset).join('\n');
  } else if (storageType === 's3' && serializationType === 'csv') {
    return S3CsvTemplate(dataset).join('\n');
  } else {
    throw new Error(
      `Template not found for ${storageType}, ${serializationType}`
    );
  }
};
