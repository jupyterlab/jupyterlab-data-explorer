/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
import { JupyterFrontEndPlugin, JupyterLab } from "@jupyterlab/application";
import {
  fileURLConverter,
  Registry,
  resolveExtensionConverter,
  resolveFileConverter,
  URLDataType
} from "@jupyterlab/dataregistry";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import * as React from "react";
import { RegistryToken } from "./registry";
import { reactDataType, UseObservable } from "./widgets";

/**
 * Integrates the dataregistry into the doc registry.
 */
export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:files",
  requires: [RegistryToken, IFileBrowserFactory],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  _: JupyterLab,
  registry: Registry,
  fileBrowserFactory: IFileBrowserFactory
) {
  // Add default converters
  registry.addConverter(resolveFileConverter);
  registry.addConverter(resolveExtensionConverter(".csv", "text/csv"));
  registry.addConverter(resolveExtensionConverter(".png", "image/png"));
  registry.addConverter(
    URLDataType.createSingleTypedConverter(reactDataType, mimeType => {
      if (mimeType !== "image/png") {
        return null;
      }
      return [
        "Image",
        $url => (
          <UseObservable observable={$url} initial={undefined}>
            {url => (url ? <img src={url} /> : <></>)}
          </UseObservable>
        )
      ];
    })
  );
  registry.addConverter(
    fileURLConverter(
      fileBrowserFactory.defaultBrowser.model.manager.services.contents
        .getDownloadUrl
    )
  );
}
