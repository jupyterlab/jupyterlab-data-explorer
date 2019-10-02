/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { IDocumentManager } from "@jupyterlab/docmanager";
import { IRegistry } from "./registry";
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import {
  Registry,
  DataTypeStringArg,
  fileDataType,
  createConverter,
  DataTypeNoArgs,
  resolveExtensionConverter,
  textDataType
} from "@jupyterlab/dataregistry";
import { Observable, defer } from "rxjs";
import { DocumentRegistry, Context } from "@jupyterlab/docregistry";
import { INotebookModel } from "@jupyterlab/notebook";
import { observableStringToObservable } from "./observables";
import { switchMap } from "rxjs/operators";

export const textContextDataType = new DataTypeStringArg<
  Observable<Context<DocumentRegistry.ICodeModel>>
>("application/x.jupyterlab.text-context", "mimeType");

export const notebookContextDataType = new DataTypeNoArgs<
  Observable<Context<INotebookModel>>
>("application/x.jupyterlab.notebook-context");

async function getContext(
  docmanager: any,
  path: string,
  factoryName: string
): Promise<Context<DocumentRegistry.IModel>> {
  // The doc manager doesn't expose a way to get a context without also opening a widget, so we have to duplicate some
  // logic from `_createOrOpenDocument` and use private methods.
  let context: Context<INotebookModel> = docmanager._findContext(
    path,
    factoryName
  );
  if (!context) {
    context = docmanager._createContext(
      path,
      docmanager.registry.getModelFactory(factoryName),
      docmanager.registry.getKernelPreference(path, "Kernel")
    );
    await context.initialize(false);
  }
  return context;
}

const notebookMimeType = "application/x.jupyterlab.notebook";
function activate(
  app: JupyterFrontEnd,
  registry: Registry,
  docmanager: IDocumentManager
) {
  registry.addConverter(
    resolveExtensionConverter(".ipynb", notebookMimeType),
    createConverter(
      { from: fileDataType, to: textContextDataType },
      ({ data, type }) => ({
        type,
        data: defer(() => getContext(docmanager, data, "text"))
      })
    ),
    createConverter(
      { from: fileDataType, to: notebookContextDataType },
      ({ data, type }) =>
        type === notebookMimeType
          ? defer(
              () =>
                getContext(docmanager, data, "notebook") as Promise<
                  Context<INotebookModel>
                >
            )
          : null
    ),
    createConverter(
      { from: textContextDataType, to: textDataType },
      ({ data, type }) => ({
        type,
        data: data.pipe(
          switchMap(context =>
            observableStringToObservable(context.model.value)
          )
        )
      })
    )
  );
}

export default {
  id: "@jupyterlab/dataregistry-extension:documents",
  requires: [IRegistry, IDocumentManager],
  activate,
  autoStart: true
} as JupyterFrontEndPlugin<void>;
