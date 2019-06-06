/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
import { JupyterFrontEndPlugin, JupyterLab } from "@jupyterlab/application";
import {
  Registry,
  folderDatasetsConverter,
  createFolderConverter
} from "@jupyterlab/dataregistry";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { RegistryToken } from "./registry";
import { Contents } from "@jupyterlab/services";

export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:folders",
  requires: [RegistryToken, IFileBrowserFactory],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  _: JupyterLab,
  registry: Registry,
  fileBrowserFactory: IFileBrowserFactory
) {
  registry.addConverter(folderDatasetsConverter);
  registry.addConverter(
    // Inspired by filebrowser.model.FileBrowserModel._handleContents
    createFolderConverter(
      async path =>
        new Set(
          [
            ...(await fileBrowserFactory.defaultBrowser.model.manager.services.contents.get(
              path
            )).content
          ].map((model: Contents.IModel) =>
            // Add trailing slash if this is a directory so that we know that.
            model.type === "directory" ? `${model.path}/` : model.path
          )
        )
    )
  );
}
