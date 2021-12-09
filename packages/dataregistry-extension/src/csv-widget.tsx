import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { Dataset } from '@jupyterlab/dataregistry';
import { JSONObject, JSONValue } from '@lumino/coreutils';

export class CsvWidget extends ReactWidget {
  readonly _dataset: Dataset<JSONValue, CsvViewer.IMetadata>;

  constructor(dataset: Dataset<JSONValue, CsvViewer.IMetadata>) {
    super();
    this._dataset = dataset;
    this.addClass('jp-csv-widget');
    this.id = 'csv-widget';
    this.title.label = 'CSV Viewer';
    this.title.closable = true;
  }

  protected render(): JSX.Element {
    return <CsvComponent dataset={this._dataset} />;
  }
}

const CsvComponent = (props: CsvViewer.IOptions): JSX.Element => {
  const { value = '', metadata } = props.dataset;
  const rows = (value as string).split(metadata.lineDelimiter as string);
  if (rows.length > 0) {
    const headers = rows[0]
      .split(metadata.delimiter as string)
      .map((header: JSONValue) => <th>{header}</th>);
    return (
      <table>
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row: JSONValue) => (
            <tr>
              {(row! as string).split(metadata.delimiter).map(col => {
                return <td>{col}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else {
    return <div></div>;
  }
};

export namespace CsvViewer {
  export interface IOptions {
    dataset: Dataset<JSONValue, CsvViewer.IMetadata>;
  }
  export interface IMetadata extends JSONObject {
    delimiter: string;
    lineDelimiter: string;
  }
}
