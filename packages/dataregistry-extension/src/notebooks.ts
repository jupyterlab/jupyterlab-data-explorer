/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import { ICellModel, isCodeCellModel } from "@jupyterlab/cells";
import {
  createConverter,
  DataTypeNoArgs,
  DataTypeStringArg,
  nestedDataType,
  Registry,
  resolveDataType,
  TypedConverter,
  URLTemplate
} from "@jupyterlab/dataregistry";
import { IOutputModel } from "@jupyterlab/rendermime";
import { IRegistry } from "@jupyterlab/dataregistry-registry";
import { ReadonlyJSONObject, ReadonlyJSONValue } from "@phosphor/coreutils";
import { defer, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { notebookContextDataType } from "./documents";
import {
  observableListToObservable,
  outputAreaModelToObservable
} from "./observables";

const notebookURL = new URLTemplate("file://{+path}", {
  path: URLTemplate.extension(".ipynb")
});

const notebookCellURL = notebookURL.extend("#/cells/{cellID}", {
  cellID: URLTemplate.number
});

const notebookOutputURL = notebookCellURL.extend("/outputs/{outputID}", {
  outputID: URLTemplate.number
});

const notebookMimeDataURL = notebookOutputURL.extend("/data/{mimeType}", {
  mimeType: URLTemplate.string
});

const notebookCellsDataType = new DataTypeNoArgs<Observable<Array<ICellModel>>>(
  "application/x.jupyterlab.notebook-cells"
);

/**
 * Convert from notebook context to a list of cells within the model
 */
const notebookContextToCells = createConverter(
  { from: notebookContextDataType, to: notebookCellsDataType },
  ({ data }) =>
    data.pipe(
      switchMap(context => observableListToObservable(context.model.cells))
    )
);

const notebookCellsToNested = createConverter(
  { from: notebookCellsDataType, to: nestedDataType, url: notebookURL },
  ({ url: { path }, data }) =>
    data.pipe(
      map(
        cells =>
          new Set(
            cells.map((_, cellID) => notebookCellURL.create({ path, cellID }))
          )
      )
    )
);

const cellModelDataType = new DataTypeNoArgs<Observable<ICellModel>>(
  "application/x.jupyterlab.cell-model"
);

/**
 * Converts from a URL like `file:///notebook.ipynb#/cells/0` to the cell model.
 */
function createResolveCellModelConverter(
  registry: Registry
): TypedConverter<typeof resolveDataType, typeof cellModelDataType> {
  return createConverter(
    { from: resolveDataType, to: cellModelDataType, url: notebookCellURL },
    ({ url: { cellID, ...rest } }) =>
      defer(() =>
        notebookCellsDataType
          .getDataset(registry.getURL(notebookURL.create(rest)))!
          .pipe(map(cells => cells[cellID]))
      )
  );
}

const outputsDataType = new DataTypeNoArgs<Observable<Array<IOutputModel>>>(
  "application/x.jupyterlab.outputs"
);

/**
 * Convert from a cell model to a list of output models. If the cell is not a code cell, the list is empty.
 */
const cellToOutputs = createConverter(
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
);

/**
 * Converts from a list of outputs to the resulting URLs
 */
const outputsToNested = createConverter(
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
);

// The data in the mimebundle of an output cell
const mimeBundleDataType = new DataTypeNoArgs<Observable<ReadonlyJSONObject>>(
  "application/x.jupyterlab.mime-bundle"
);

/**
 * Register a conversion from a URL like `file:///notebook.ipynb#/cells/0/output/0` to
 * the mimebundle for the output.
 */
function createOutputConverter(
  registry: Registry
): TypedConverter<typeof resolveDataType, typeof mimeBundleDataType> {
  return createConverter(
    { from: resolveDataType, to: mimeBundleDataType, url: notebookOutputURL },
    ({ url: { outputID, ...rest } }) =>
      defer(() =>
        outputsDataType
          .getDataset(registry.getURL(notebookCellURL.create(rest)))!
          .pipe(map(outputs => outputs[outputID].data))
      )
  );
}

// The data for a certain mimetype in an output.
const mimeDataDataType = new DataTypeStringArg<Observable<ReadonlyJSONValue>>(
  "application/x.jupyterlab.mimedata",
  "mimeType"
);

/**
 * Converts from a URL with a mimebundle, which is the output, to one with the mimeType
 * added.
 */
const mimeBundleNested = createConverter(
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
);

/**
 * Create a conversion a mimebundle data `file:///notebook.ipynb#/cells/0/output/0/data/text/csv` to
 * that mimedata.
 */
function createMimeDataConverter(
  registry: Registry
): TypedConverter<typeof resolveDataType, typeof mimeDataDataType> {
  return createConverter(
    { from: resolveDataType, to: mimeDataDataType, url: notebookMimeDataURL },
    ({ url: { mimeType, ...rest } }) => ({
      type: mimeType,
      data: defer(() =>
        mimeBundleDataType
          .getDataset(registry.getURL(notebookOutputURL.create(rest)))!
          .pipe(map(mimeBundle => mimeBundle[mimeType]))
      )
    })
  );
}

/**
 * Create the right mime type for for mime bundle data.
 */
const mimeBundleDataConverter = createConverter<
  Observable<ReadonlyJSONValue>,
  Observable<ReadonlyJSONValue>,
  string,
  string
>({ from: mimeDataDataType }, ({ type, data }) => ({ type, data }));

function activate(app: JupyterFrontEnd, registry: Registry) {
  registry.addConverter(notebookContextToCells);
  registry.addConverter(notebookCellsToNested);
  registry.addConverter(createResolveCellModelConverter(registry));
  registry.addConverter(cellToOutputs);
  registry.addConverter(outputsToNested);
  registry.addConverter(createOutputConverter(registry));
  registry.addConverter(mimeBundleNested);
  registry.addConverter(createMimeDataConverter(registry));
  registry.addConverter(mimeBundleDataConverter);
}

export default {
  id: "@jupyterlab/dataregistry-extension:notebooks",
  requires: [IRegistry],
  activate,
  autoStart: true
} as JupyterFrontEndPlugin<void>;
