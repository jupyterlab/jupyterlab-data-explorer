import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import { ICellModel, isCodeCellModel } from "@jupyterlab/cells";
import {
  DataTypeNoArgs,
  DataTypeStringArg,
  fileDataType,
  nestedDataType,
  Registry,
  resolveDataType,
  resolveExtensionConverter,
  TypedConverter
} from "@jupyterlab/dataregistry";
import { IDocumentManager } from "@jupyterlab/docmanager";
import { Context } from "@jupyterlab/docregistry";
import { INotebookModel } from "@jupyterlab/notebook";
import { IOutputModel } from "@jupyterlab/rendermime";
import { ReadonlyJSONObject, ReadonlyJSONValue } from "@phosphor/coreutils";
import { defer, from, Observable } from "rxjs";
import { map, shareReplay, switchMap } from "rxjs/operators";
import {
  observableListToObservable,
  outputAreaModelToObservable
} from "./observables";
import { RegistryToken } from "./registry";

// class DataURL<T> {
//     fromURL(url: )
//     toString(): string
// }

// // Parent/child URLs?
// new NotebookURL(notebookPath)

// new CellURL(notebookURL, cellID)

// new OutputURL(cellURL, outputID)

// new OutputDataURL(outputURL, mimeType)

// parse(URL) -> parentURL, params
// generate(parentURL, params) -> URL
// toString() => URL

// new ChildURL()

/**
 * This defines a nested data type for notebooks, so that a notebook
 * `file:///notebook.ipynb` will have children `file:///notebook.ipynb#/cells/0/outputs/0`,etc
 */

//  TODO: Update this to the right mimetype for a notebook
const NOTEBOOK_MIMETYPE = "application/x.jupyterlab.notebook";

const notebookContextDataType = new DataTypeNoArgs<
  Observable<Context<INotebookModel>>
>("application/x.jupyterlab.notebook-context");

// 'file:///{path}.ipynb/#/cells/{cellid}/outputs/{outputid}/data/{mimetype}'

/**
 * Convert from notebook files to their model context
 */
function createNotebookContextConverter(
  docmanager: any
): TypedConverter<typeof fileDataType, typeof notebookContextDataType> {
  async function getNotebookContext(
    path: string
  ): Promise<Context<INotebookModel>> {
    // The doc manager doesn't expose a way to get a context without also opening a widget, so we have to duplicate some
    // logic from `_createOrOpenDocument` and use private methods.
    let context: Context<INotebookModel> = docmanager._findContext(
      path,
      "notebook"
    );
    if (!context) {
      context = docmanager._createContext(
        path,
        docmanager.registry.getModelFactory("notebook"),
        docmanager.registry.getKernelPreference(path, "Kernel")
      );
      await context.initialize(false);
    }
    return context;
  }
  return fileDataType.createTypedConverter(notebookContextDataType, mimeType =>
    mimeType === NOTEBOOK_MIMETYPE
      ? new Map([
          [
            ,
            // TODO: remove context once it has no more listeners
            path =>
              defer(() => getNotebookContext(path)).pipe(
                shareReplay({ refCount: true, bufferSize: 1 })
              )
          ]
        ])
      : new Map()
  );
}

const notebookCellsDataType = new DataTypeNoArgs<Observable<Array<ICellModel>>>(
  "application/x.jupyterlab.notebook-cells"
);

/**
 * Convert from notebook context to a list of cells within the model
 */
const notebookContextToCells = notebookContextDataType.createSingleTypedConverter(
  notebookCellsDataType,
  () => [
    ,
    context$ =>
      context$.pipe(
        switchMap(context => observableListToObservable(context.model.cells)),
        shareReplay({ refCount: true, bufferSize: 1 })
      )
  ]
);

const notebookCellsToNested = notebookCellsDataType.createSingleTypedConverter(
  nestedDataType,
  (_, url) => [
    ,
    cells$ =>
      cells$.pipe(
        map(
          cells =>
            new Set(
              cells.map((_, i) => {
                const u = new URL(url);
                u.hash = `/cells/${i}`;
                return u.toString();
              })
            )
        ),
        shareReplay({ refCount: true, bufferSize: 1 })
      )
  ]
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
  return resolveDataType.createSingleTypedConverter(
    cellModelDataType,
    (_, url) => {
      // Extract the cell ID from the URL
      const u = new URL(url);

      const result = u.hash.match(/^[#][/]cells[/](\d+)$/);
      if (u.protocol !== "file:" || !u.pathname.endsWith(".ipynb") || !result) {
        return null;
      }
      const cellID = Number(result[1]);

      // Create the original notebook URL and get the cells from it
      u.hash = "";
      const notebookURL = u.toString();

      return [
        ,
        () =>
          notebookCellsDataType
            .getDataset(registry.getURL(notebookURL))
            .pipe(map(cells => cells[cellID]))
      ];
    }
  );
}

const outputsDataType = new DataTypeNoArgs<Observable<Array<IOutputModel>>>(
  "application/x.jupyterlab.outputs"
);

/**
 * Convert from a cell model to a list of output models. If the cell is not a code cell, the list is empty.
 */
const cellToOutputs = cellModelDataType.createSingleTypedConverter(
  outputsDataType,
  () => [
    null,
    cellModel$ =>
      cellModel$.pipe(
        switchMap(cellModel => {
          if (isCodeCellModel(cellModel)) {
            return defer(() => outputAreaModelToObservable(cellModel.outputs));
          }
          return from([]);
        }),
        shareReplay({ refCount: true, bufferSize: 1 })
      )
  ]
);

/**
 * Converts from a list of outputs to the resulting URLs
 */
const outputsToNested = outputsDataType.createSingleTypedConverter(
  nestedDataType,
  (_, url) => [
    null,
    outputs$ =>
      outputs$.pipe(
        map(outputs => new Set(outputs.map((_, i) => `${url}/outputs/${i}`)))
      )
  ]
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
  return resolveDataType.createSingleTypedConverter(
    mimeBundleDataType,
    (_, url) => {
      const u = new URL(url);

      const result = u.hash.match(/^[#]([/]cells[/]\d+)[/]outputs[/](\d+)$/);
      if (u.protocol !== "file:" || !u.pathname.endsWith(".ipynb") || !result) {
        return null;
      }
      const cellHash = result[1];
      const outputID = Number(result[2]);

      // Create the original output URL and get the cells from it
      u.hash = cellHash;
      const cellURL = u.toString();

      const data$ = defer(() =>
        outputsDataType.getDataset(registry.getURL(cellURL)).pipe(
          map(outputs => {
            console.log(outputs, outputID);
            return outputs[outputID].data;
          }),
          shareReplay({ refCount: true, bufferSize: 1 })
        )
      );
      return [, () => data$];
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
const mimeBundleNested = mimeBundleDataType.createSingleTypedConverter(
  nestedDataType,
  (_, url) => [
    ,
    map(
      data =>
        new Set(Object.keys(data).map(mimeType => `${url}/data/${mimeType}`))
    )
  ]
);

/**
 * Create a conversion a mimebundle data `file:///notebook.ipynb#/cells/0/output/0/data/text/csv` to
 * that mimedata.
 */
function createMimeDataConverter(
  registry: Registry
): TypedConverter<typeof resolveDataType, typeof mimeDataDataType> {
  return resolveDataType.createSingleTypedConverter(
    mimeDataDataType,
    (_, url) => {
      const u = new URL(url);

      const result = u.hash.match(
        /^[#]([/]cells[/]\d+[/]outputs[/]\d+)[/]data[/](.*)$/
      );
      if (u.protocol !== "file:" || !u.pathname.endsWith(".ipynb") || !result) {
        return null;
      }
      const [, outputHash, mimeType] = result;

      // Create the original output URL and get the cells from it
      u.hash = outputHash;
      const outputURL = u.toString();

      const data$ = defer(() =>
        mimeBundleDataType.getDataset(registry.getURL(outputURL)).pipe(
          map(mimeBundle => mimeBundle[mimeType]),
          shareReplay({ refCount: true, bufferSize: 1 })
        )
      );
      return [mimeType, () => data$];
    }
  );
}

/**
 * Create the right mime type for for mime bundle data.
 */
const mimeBundleDataConverter = mimeDataDataType.createSingleConverter(
  mimeType => [mimeType, data => data]
);

function activate(
  app: JupyterFrontEnd,
  registry: Registry,
  docmanager: IDocumentManager
) {
  registry.addConverter(resolveExtensionConverter(".ipynb", NOTEBOOK_MIMETYPE));
  registry.addConverter(createNotebookContextConverter(docmanager));
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
  requires: [RegistryToken, IDocumentManager],
  activate,
  autoStart: true
} as JupyterFrontEndPlugin<void>;
