/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from '@jupyterlab/application';
import { ICellModel, isCodeCellModel } from '@jupyterlab/cells';
import {
  Converter,
  createConverter,
  DataTypeNoArgs,
  DataTypeStringArg,
  externalURLDataType,
  internalURLDataType,
  nestedDataType,
  Registry,
  resolveDataType,
  URLTemplate
} from '@jupyterlab/dataregistry';
import { IOutputModel } from '@jupyterlab/rendermime';
import { IRegistry } from '@jupyterlab/dataregistry-registry-extension';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ReadonlyJSONObject, ReadonlyJSONValue } from '@lumino/coreutils';
import { combineLatest, defer, Observable, of, from } from 'rxjs';
import { map, switchMap, filter } from 'rxjs/operators';
import { notebookContextDataType } from './documents';
import {
  observableListToObservable,
  outputAreaModelToObservable
} from './observables';
import { IActiveDataset } from './active';
import { signalToObservable } from './utils';

/**
 * URLS
 */

const notebookURL = new URLTemplate('file://{+path}', {
  path: URLTemplate.extension('.ipynb')
});

const notebookCellURL = notebookURL.extend('#/cell-model/{cellID}', {
  cellID: URLTemplate.uuid
});

const notebookCellExternalURL = notebookURL.extend('#/cells/{cellIndex}', {
  cellIndex: URLTemplate.number
});

const notebookOutputURL = notebookCellURL.extend('/outputs/{outputID}', {
  outputID: URLTemplate.number
});

const notebookOutputExternalURL = notebookCellExternalURL.extend(
  '/outputs/{outputID}',
  {
    outputID: URLTemplate.number
  }
);

const notebookMimeDataURL = notebookOutputURL.extend('/data/{mimeType}', {
  mimeType: URLTemplate.string
});

const notebookMimeDataExternalURL = notebookOutputExternalURL.extend(
  '/data/{mimeType}',
  {
    mimeType: URLTemplate.string
  }
);

/**
 * Mimetypes
 */

const notebookCellsDataType = new DataTypeNoArgs<Observable<Array<ICellModel>>>(
  'application/x.jupyterlab.notebook-cells'
);

const cellModelDataType = new DataTypeNoArgs<Observable<ICellModel>>(
  'application/x.jupyterlab.cell-model'
);

const cellIndexDataType = new DataTypeNoArgs<Observable<number>>(
  'application/x.jupyterlab.cell-index'
);
const cellIDDataType = new DataTypeNoArgs<Observable<string>>(
  'application/x.jupyterlab.cell-id'
);

const outputsDataType = new DataTypeNoArgs<Observable<Array<IOutputModel>>>(
  'application/x.jupyterlab.outputs'
);

// The data in the mimebundle of an output cell
const mimeBundleDataType = new DataTypeNoArgs<Observable<ReadonlyJSONObject>>(
  'application/x.jupyterlab.mime-bundle'
);

// The data for a certain mimetype in an output.
const mimeDataDataType = new DataTypeStringArg<Observable<ReadonlyJSONValue>>(
  'application/x.jupyterlab.mimedata',
  'mimeType'
);

/**
 * Converters
 */

export function createConverters(
  registry: Registry
): Array<Converter<any, any>> {
  return [
    /**
     * Notebook
     */
    createConverter(
      { from: notebookContextDataType, to: notebookCellsDataType },
      ({ data }) =>
        data.pipe(
          switchMap(context => observableListToObservable(context.model.cells))
        )
    ),
    createConverter(
      { from: notebookCellsDataType, to: nestedDataType, url: notebookURL },
      ({ url: { path }, data }) =>
        data.pipe(
          map(
            cells =>
              new Set(
                cells.map(arg =>
                  notebookCellURL.create({ path, cellID: arg.id })
                )
              )
          )
        )
    ),

    /**
     * Cell
     */
    createConverter(
      {
        from: resolveDataType,
        to: cellIndexDataType,
        url: notebookCellURL
      },
      ({ url: { cellID, ...rest } }) =>
        defer(() =>
          notebookCellsDataType
            .getDataset(registry.getURL(notebookURL.create(rest)))!
            .pipe(map(cells => cells.findIndex(cell => cell.id === cellID)))
        )
    ),
    createConverter(
      {
        from: cellIndexDataType,
        to: cellModelDataType,
        url: notebookCellURL
      },
      ({ data, url: { cellID, ...rest } }) =>
        defer(() =>
          combineLatest(
            data,
            notebookCellsDataType.getDataset(
              registry.getURL(notebookURL.create(rest))
            )!
          ).pipe(map(([index, cells]) => cells[index]))
        )
    ),
    createConverter(
      { from: cellModelDataType, to: outputsDataType },
      ({ data }) =>
        data.pipe(
          switchMap(cellModel => {
            if (isCodeCellModel(cellModel)) {
              return outputAreaModelToObservable(cellModel.outputs);
            }
            return of([]);
          })
        )
    ),
    createConverter(
      { from: outputsDataType, to: nestedDataType, url: notebookCellURL },
      ({ url, data }) =>
        data.pipe(
          map(
            outputs =>
              new Set(
                outputs.map((_, outputID) =>
                  notebookOutputURL.create({ outputID, ...url })
                )
              )
          )
        )
    ),
    createConverter(
      {
        from: cellIndexDataType,
        to: externalURLDataType,
        url: notebookCellURL
      },
      ({ data, url: { cellID, ...rest } }) =>
        data.pipe(
          map(cellIndex =>
            notebookCellExternalURL.create({
              ...rest,
              cellIndex
            })
          )
        )
    ),
    createConverter(
      {
        from: resolveDataType,
        to: cellIDDataType,
        url: notebookCellExternalURL
      },
      ({ url: { cellIndex, ...rest } }) =>
        defer(() =>
          notebookCellsDataType
            .getDataset(registry.getURL(notebookURL.create(rest)))!
            .pipe(map(cells => cells[cellIndex].id))
        )
    ),
    createConverter(
      {
        from: cellIDDataType,
        to: internalURLDataType,
        url: notebookCellExternalURL
      },
      ({ url: { path }, data }) =>
        data.pipe(
          map(cellID =>
            notebookCellURL.create({
              path,
              cellID
            })
          )
        )
    ),

    /**
     * Output
     */
    createConverter(
      { from: resolveDataType, to: mimeBundleDataType, url: notebookOutputURL },
      ({ url: { outputID, ...rest } }) =>
        defer(() =>
          outputsDataType
            .getDataset(registry.getURL(notebookCellURL.create(rest)))!
            .pipe(map(outputs => outputs[outputID].data))
        )
    ),
    createConverter(
      { from: mimeBundleDataType, to: nestedDataType, url: notebookOutputURL },
      ({ url, data }) =>
        data.pipe(
          map(
            mimeData =>
              new Set(
                Object.keys(mimeData).map(mimeType =>
                  notebookMimeDataURL.create({ ...url, mimeType })
                )
              )
          )
        )
    ),
    createConverter(
      {
        from: resolveDataType,
        to: externalURLDataType,
        url: notebookOutputURL
      },
      ({ url: { outputID, cellID, path } }) =>
        defer(() =>
          cellIndexDataType
            .getDataset(
              registry.getURL(notebookCellURL.create({ path, cellID }))
            )!
            .pipe(
              map(cellIndex =>
                notebookOutputExternalURL.create({
                  path,
                  cellIndex,
                  outputID
                })
              )
            )
        )
    ),
    createConverter(
      {
        from: resolveDataType,
        to: internalURLDataType,
        url: notebookOutputExternalURL
      },
      ({ url: { outputID, cellIndex, path } }) =>
        defer(() =>
          cellIDDataType
            .getDataset(
              registry.getURL(
                notebookCellExternalURL.create({ path, cellIndex })
              )
            )!
            .pipe(
              map(cellID =>
                notebookOutputURL.create({
                  path,
                  cellID,
                  outputID
                })
              )
            )
        )
    ),

    /**
     * MimeData
     */
    createConverter(
      { from: resolveDataType, to: mimeDataDataType, url: notebookMimeDataURL },
      ({ url: { mimeType, ...rest } }) => ({
        type: mimeType,
        data: defer(() =>
          mimeBundleDataType
            .getDataset(registry.getURL(notebookOutputURL.create(rest)))!
            .pipe(map(mimeBundle => mimeBundle[mimeType]))
        )
      })
    ),
    createConverter(
      {
        from: resolveDataType,
        to: externalURLDataType,
        url: notebookMimeDataURL
      },
      ({ url: { path, cellID, outputID, mimeType } }) =>
        defer(() =>
          cellIndexDataType
            .getDataset(
              registry.getURL(notebookCellURL.create({ path, cellID }))
            )!
            .pipe(
              map(cellIndex =>
                notebookMimeDataExternalURL.create({
                  path,
                  cellIndex,
                  outputID,
                  mimeType
                })
              )
            )
        )
    ),
    createConverter(
      {
        from: resolveDataType,
        to: internalURLDataType,
        url: notebookMimeDataExternalURL
      },
      ({ url: { outputID, cellIndex, path, mimeType } }) =>
        defer(() =>
          cellIDDataType
            .getDataset(
              registry.getURL(
                notebookCellExternalURL.create({ path, cellIndex })
              )
            )!
            .pipe(
              map(cellID =>
                notebookMimeDataURL.create({
                  path,
                  cellID,
                  mimeType,
                  outputID
                })
              )
            )
        )
    ),
    createConverter<
      Observable<ReadonlyJSONValue>,
      Observable<ReadonlyJSONValue>,
      string,
      string
    >({ from: mimeDataDataType }, ({ type, data }) => ({ type, data }))
  ];
}

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry,
  active: IActiveDataset
) {
  // get the url of all active  cells, and set the active url to them
  signalToObservable(labShell.currentChanged)
    .pipe(
      switchMap(([_, { newValue }]) => {
        if (newValue instanceof NotebookPanel) {
          return signalToObservable(newValue.content.activeCellChanged).pipe(
            // filter for unselected cells
            filter(([notebook, cell]) => !!cell),
            map(([notebook, cell]) =>
              notebookCellURL.create({
                path: `/${newValue.context.path}`,
                cellID: cell.model.id
              })
            )
          );
        }
        return from([]);
      })
    )
    .subscribe({
      next: url => {
        active.next(url);
      }
    });
  registry.addConverter(...createConverters(registry));
}

export default {
  id: '@jupyterlab/dataregistry-extension:notebooks',
  requires: [ILabShell, IRegistry, IActiveDataset],
  activate,
  autoStart: true
} as JupyterFrontEndPlugin<void>;
