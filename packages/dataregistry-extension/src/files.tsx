/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { JupyterFrontEndPlugin, JupyterLab } from '@jupyterlab/application';
import {
  createConverter,
  fileURLConverter,
  Registry,
  resolveExtensionConverter,
  resolveFileConverter,
  URLDataType,
} from '@jupyterlab/dataregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import React from 'react';
import { IRegistry } from '@jupyterlab/dataregistry-registry-extension';
import { UseObservable } from './utils';
import { reactDataType } from './widgets';

/**
 * Integrates the dataregistry into the doc registry.
 */
export default {
  activate,
  id: '@jupyterlab/dataregistry-extension:files',
  requires: [IRegistry, IFileBrowserFactory],
  autoStart: true,
} as JupyterFrontEndPlugin<void>;

function activate(
  _: JupyterLab,
  registry: Registry,
  fileBrowserFactory: IFileBrowserFactory
) {
  // Add default converters
  registry.addConverter(
    resolveFileConverter,
    resolveExtensionConverter('.png', 'image/png'),
    createConverter(
      { from: URLDataType, to: reactDataType },
      ({ type, data }) => {
        if (type !== 'image/png') {
          return null;
        }
        return {
          type: 'Image',
          data: (
            <UseObservable observable={data} initial={undefined}>
              {(url) => (url ? <img src={url} /> : <></>)}
            </UseObservable>
          ),
        };
      }
    ),
    fileURLConverter((path) =>
      fileBrowserFactory.defaultBrowser.model.manager.services.contents.getDownloadUrl(
        path
      )
    )
  );
}
