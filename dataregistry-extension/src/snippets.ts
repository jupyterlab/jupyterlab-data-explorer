/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import {
  IConverterRegistry,
  snippetViewerConverter,
  fileSnippetConverter,
  URL_SnippetConverter
} from "@jupyterlab/dataregistry";
import { INotebookTracker } from "@jupyterlab/notebook";

export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:snippets",
  requires: [IConverterRegistry, INotebookTracker],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

/**
 * Support for exporting datasets as code snippets.
 */

import { viewerDataType, View } from "./viewers";

import { relative, dirname } from "path";
import {
  DataTypeStringArg,
  Converter,
  FilePath,
  fileDataType,
  URL_,
  URLDataType
} from "@jupyterlab/dataregistry-core";
import { map } from "rxjs/operators";
type SnippetContext = {
  path: string;
};

type Snippet = (context: SnippetContext) => string;

export const snippedDataType = new DataTypeStringArg<Snippet>(
  "application/x.jupyter.snippet",
  "label"
);

export interface IFileSnippetConverterOptions {
  mimeType: string;
  createSnippet: (path: string) => string;
  label: string;
}

export function fileSnippetConverter({
  mimeType,
  createSnippet,
  label
}: IFileSnippetConverterOptions): Converter<FilePath, Snippet> {
  return fileDataType.createSingleTypedConverter(
    snippedDataType,
    innerMimeType => {
      if (innerMimeType !== mimeType) {
        return null;
      }
      return [
        label,
        [
          1,
          map(dataPath => (context: SnippetContext) =>
            createSnippet(relative(dirname(context.path), dataPath))
          )
        ]
      ];
    }
  );
}

export interface IURL_SnippetConverter {
  mimeType: string;
  createSnippet: (url: URL_) => string;
  label: string;
}

export function URLSnippetConverter({
  mimeType,
  createSnippet,
  label
}: IURL_SnippetConverter): Converter<URL_, Snippet> {
  return URLDataType.createSingleTypedConverter(
    snippedDataType,
    (innerMimeType: string) => {
      if (innerMimeType !== mimeType) {
        return null;
      }
      return [label, [1, map((url: URL_) => () => createSnippet(url))]];
    }
  );
}

export function snippetViewerConverter(
  insert: (snippet: string) => Promise<void>,
  getContext: () => Promise<SnippetContext>
): Converter<Snippet, View> {
  return snippedDataType.createSingleTypedConverter(viewerDataType, label => {
    return [
      label,
      [1, map(data => async () => await insert(data(await getContext())))]
    ];
  });
}

function activate(
  app: JupyterFrontEnd,
  converters: IConverterRegistry,
  notebookTracker: INotebookTracker
) {
  converters.register(
    snippetViewerConverter(
      async (snippet: string) => {
        notebookTracker.activeCell.model.value.insert(0, snippet);
      },
      async () => ({
        path: notebookTracker.currentWidget!.context.path
      })
    )
  );
  converters.register(
    fileSnippetConverter({
      mimeType: "text/csv",
      label: "Snippet",
      createSnippet: path =>
        `import pandas as pd\n\ndf = pd.read_csv(${JSON.stringify(path)})\ndf`
    })
  );
  converters.register(
    URL_SnippetConverter({
      mimeType: "text/csv",
      label: "Snippet",
      createSnippet: (url: string | URL_) =>
        `import pandas as pd\n\ndf = pd.read_csv(${JSON.stringify(
          url.toString()
        )})\ndf`
    })
  );
}
