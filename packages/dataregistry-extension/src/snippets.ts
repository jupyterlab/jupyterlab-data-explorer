/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { relative, dirname } from 'path';
import { INotebookTracker } from '@jupyterlab/notebook';

import { first } from 'rxjs/operators';
import {
  DataTypeStringArg,
  fileDataType,
  URL_,
  URLDataType,
  TypedConverter,
  createConverter,
  Registry,
} from '@jupyterlab/dataregistry';
import { IRegistry } from '@jupyterlab/dataregistry-registry-extension';
import { viewerDataType } from './viewers';

type SnippetContext = {
  path: string;
};

export const snippedDataType = new DataTypeStringArg<
  (context: SnippetContext) => Promise<string>
>('application/x.jupyter.snippet', 'label');

export interface IFileSnippetConverterOptions {
  mimeType: string;
  createSnippet: (path: string) => string;
  label: string;
}

export function fileSnippetConverter({
  mimeType,
  createSnippet,
  label,
}: IFileSnippetConverterOptions): TypedConverter<
  typeof fileDataType,
  typeof snippedDataType
> {
  return createConverter(
    { from: fileDataType, to: snippedDataType },
    ({ type, data }) => {
      if (type !== mimeType) {
        return null;
      }
      return {
        type: label,
        data: async (context: SnippetContext) =>
          createSnippet(relative(dirname(context.path), data)),
      };
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
  label,
}: IURLSnippetConverter): TypedConverter<
  typeof URLDataType,
  typeof snippedDataType
> {
  return createConverter(
    { from: URLDataType, to: snippedDataType },
    ({ type, data }) => {
      if (type !== mimeType) {
        return null;
      }
      return {
        type: label,
        data: async () => createSnippet(await data.pipe(first()).toPromise()),
      };
    }
  );
}

export default {
  id: '@jupyterlab/dataregistry-extension:snippets',
  requires: [IRegistry, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    registry: Registry,
    notebookTracker: INotebookTracker
  ) => {
    registry.addConverter(
      createConverter(
        { from: snippedDataType, to: viewerDataType },
        ({ type, data }) => ({
          type,
          data: async () =>
            notebookTracker.activeCell?.model.value.insert(
              0,
              await data({
                path: notebookTracker.currentWidget!.context.path,
              })
            ),
        })
      ),
      fileSnippetConverter({
        mimeType: 'text/csv',
        label: 'Snippet',
        createSnippet: (path) =>
          `import pandas as pd\n\ndf = pd.read_csv(${JSON.stringify(
            path
          )})\ndf`,
      }),
      URLSnippetConverter({
        mimeType: 'text/csv',
        label: 'Snippet',
        createSnippet: (url: URL_) =>
          `import pandas as pd\n\ndf = pd.read_csv(${JSON.stringify(url)})\ndf`,
      })
    );
  },

  autoStart: true,
} as JupyterFrontEndPlugin<void>;
