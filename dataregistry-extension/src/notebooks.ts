import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import { ICellModel, isCodeCellModel } from "@jupyterlab/cells";
import {
  DataTypeNoArgs,
  DataTypeStringArg,
  nestedDataType,
  Registry,
  resolveDataType,
  TypedConverter,
  createConverter,
} from "@jupyterlab/dataregistry";
import { IOutputModel } from "@jupyterlab/rendermime";
import { ReadonlyJSONObject, ReadonlyJSONValue } from "@phosphor/coreutils";
import { defer, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  observableListToObservable,
  outputAreaModelToObservable
} from "./observables";
import { RegistryToken } from "./registry";
import { notebookContextDataType } from "./documents";


/**
 * This defines a nested data type for notebooks, so that a notebook
 * `file:///notebook.ipynb` will have children `file:///notebook.ipynb#/cells/0/outputs/0`,etc
 */

// 'file:///{path}.ipynb/#/cells/{cellid}/outputs/{outputid}/data/{mimetype}'

const notebookCellsDataType = new DataTypeNoArgs<Observable<Array<ICellModel>>>(
  "application/x.jupyterlab.notebook-cells"
);

/**
 * Convert from notebook context to a list of cells within the model
 */
const notebookContextToCells = createConverter(
  { from: notebookContextDataType, to: notebookCellsDataType },
  ({ data }) => ({
    data: data.pipe(
      switchMap(context => observableListToObservable(context.model.cells))
    ),
    type: undefined
  })
);

const notebookCellsToNested = createConverter(
  { from: notebookCellsDataType, to: nestedDataType },
  ({ url, data }) => ({
    type: undefined,
    data: data.pipe(
      map(
        cells =>
          new Set(
            cells.map((_, i) => {
              url = new URL(url.toString());
              url.hash = `/cells/${i}`;
              return url.toString();
            })
          )
      )
    )
  })
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
    { from: resolveDataType, to: cellModelDataType },
    ({ url }) => {
      const result = url.hash.match(/^[#][/]cells[/](\d+)$/);
      if (
        url.protocol !== "file:" ||
        !url.pathname.endsWith(".ipynb") ||
        !result
      ) {
        return null;
      }
      const cellID = Number(result[1]);

      // Create the original notebook URL and get the cells from it
      url.hash = "";
      const notebookURL = url.toString();
      return {
        type: undefined,
        data: defer(() =>
          notebookCellsDataType
            .getDataset(registry.getURL(notebookURL))
            .pipe(map(cells => cells[cellID]))
        )
      };
    }
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
  ({ data }) => ({
    type: undefined,
    data: data.pipe(
      switchMap(cellModel => {
        if (isCodeCellModel(cellModel)) {
          return outputAreaModelToObservable(cellModel.outputs);
        }
        return of([]);
      })
    )
  })
);

/**
 * Converts from a list of outputs to the resulting URLs
 */
const outputsToNested = createConverter(
  { from: outputsDataType, to: nestedDataType },
  ({ url, data }) => ({
    type: undefined,
    data: data.pipe(
      map(outputs => new Set(outputs.map((_, i) => `${url}/outputs/${i}`)))
    )
  })
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
    { from: resolveDataType, to: mimeBundleDataType },
    ({ url }) => {
      const result = url.hash.match(/^[#]([/]cells[/]\d+)[/]outputs[/](\d+)$/);
      if (
        url.protocol !== "file:" ||
        !url.pathname.endsWith(".ipynb") ||
        !result
      ) {
        return null;
      }
      const cellHash = result[1];
      const outputID = Number(result[2]);

      // Create the original output URL and get the cells from it
      url.hash = cellHash;
      const cellURL = url.toString();

      const data = defer(() =>
        outputsDataType
          .getDataset(registry.getURL(cellURL))
          .pipe(map(outputs => outputs[outputID].data))
      );
      return { data, type: undefined };
    }
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
  { from: mimeBundleDataType, to: nestedDataType },
  ({ url, data }) => ({
    type: undefined,
    data: data.pipe(
      map(
        mimeData =>
          new Set(
            Object.keys(mimeData).map(mimeType => `${url}/data/${mimeType}`)
          )
      )
    )
  })
);

/**
 * Create a conversion a mimebundle data `file:///notebook.ipynb#/cells/0/output/0/data/text/csv` to
 * that mimedata.
 */
function createMimeDataConverter(
  registry: Registry
): TypedConverter<typeof resolveDataType, typeof mimeDataDataType> {
  return createConverter(
    { from: resolveDataType, to: mimeDataDataType },
    ({ url }) => {
      const result = decodeURIComponent(url.hash).match(
        /^[#]([/]cells[/]\d+[/]outputs[/]\d+)[/]data[/](.*)$/
      );
      if (
        url.protocol !== "file:" ||
        !url.pathname.endsWith(".ipynb") ||
        !result
      ) {
        return null;
      }
      const [, outputHash, type] = result;

      // Create the original output URL and get the cells from it
      url.hash = outputHash;
      const outputURL = url.toString();

      const data = defer(() =>
        mimeBundleDataType
          .getDataset(registry.getURL(outputURL))
          .pipe(map(mimeBundle => mimeBundle[type]))
      );
      return { type, data };
    }
  );
}

/**
 * Create the right mime type for for mime bundle data.
 */
const mimeBundleDataConverter = createConverter(
  { from: mimeDataDataType },
  ({ type, data }) => ({ type, data })
);

function activate(
  app: JupyterFrontEnd,
  registry: Registry,
) {
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
  requires: [RegistryToken],
  activate,
  autoStart: true
} as JupyterFrontEndPlugin<void>;
