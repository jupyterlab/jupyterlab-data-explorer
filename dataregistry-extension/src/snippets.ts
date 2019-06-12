/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import { relative, dirname } from "path";
import { INotebookTracker } from "@jupyterlab/notebook";

import { map, first } from "rxjs/operators";
import {
  DataTypeStringArg,
  fileDataType,
  URL_,
  URLDataType,
  TypedConverter,
  Registry
} from "@jupyterlab/dataregistry";
import { viewerDataType } from "./viewers";
import { RegistryToken } from "./registry";
import { Observable, BehaviorSubject } from "rxjs";

type SnippetContext = {
  path: string;
};

export const snippedDataType = new DataTypeStringArg<
  Observable<(context: SnippetContext) => string>
>("application/x.jupyter.snippet", "label");

export interface IFileSnippetConverterOptions {
  mimeType: string;
  createSnippet: (path: string) => string;
  label: string;
}

export function fileSnippetConverter({
  mimeType,
  createSnippet,
  label
}: IFileSnippetConverterOptions): TypedConverter<
  typeof fileDataType,
  typeof snippedDataType
> {
  return fileDataType.createSingleTypedConverter(
    snippedDataType,
    innerMimeType => {
      if (innerMimeType !== mimeType) {
        return null;
      }
      return [
        label,
        dataPath =>
          new BehaviorSubject((context: SnippetContext) =>
            createSnippet(relative(dirname(context.path), dataPath))
          )
      ];
    }
  );
}

export interface IURLSnippetConverter {
  mimeType: string;
  createSnippet: (url: URL_) => string;
  label: string;
}

export function URLSnippetConverter({
  mimeType,
  createSnippet,
  label
}: IURLSnippetConverter): TypedConverter<
  typeof URLDataType,
  typeof snippedDataType
> {
  return URLDataType.createSingleTypedConverter(
    snippedDataType,
    (innerMimeType: string) => {
      if (innerMimeType !== mimeType) {
        return null;
      }
      return [label, map(url => () => createSnippet(url))];
    }
  );
}

export default {
  id: "@jupyterlab/dataregistry-extension:snippets",
  requires: [RegistryToken, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    registry: Registry,
    notebookTracker: INotebookTracker
  ) => {
    registry.addConverter(
      snippedDataType.createSingleTypedConverter(viewerDataType, label => [
        label,
        data$ => () =>
          data$
            .pipe(first())
            .toPromise()
            .then(data =>
              notebookTracker.activeCell.model.value.insert(
                0,
                data({
                  path: notebookTracker.currentWidget!.context.path
                })
              )
            )
      ])
    );
    registry.addConverter(
      fileSnippetConverter({
        mimeType: "text/csv",
        label: "Snippet",
        createSnippet: path =>
          `import pandas as pd\n\ndf = pd.read_csv(${JSON.stringify(path)})\ndf`
      })
    );
    registry.addConverter(
      URLSnippetConverter({
        mimeType: "text/csv",
        label: "Snippet",
        createSnippet: (url: URL_) =>
          `import pandas as pd\n\ndf = pd.read_csv(${JSON.stringify(url)})\ndf`
      })
    );
  },

  autoStart: true
} as JupyterFrontEndPlugin<void>;
