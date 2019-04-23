import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  createTableDataFactory,
  IDatasetRegistry,
  Dataset,
  IDataExplorer,
  IActiveDataset,
  IConverterRegistry,
  nteractDataExplorerConverter
} from '@jupyterlab/dataregistry';

export default {
  activate,
  id: '@jupyterlab/dataregistry-extension:table-data',
  requires: [
    IRenderMimeRegistry,
    IDatasetRegistry,
    IDataExplorer,
    IConverterRegistry,
    IActiveDataset
  ],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  app: JupyterFrontEnd,
  rendermime: IRenderMimeRegistry,
  data: IDatasetRegistry,
  dataExplorer: IDataExplorer,
  converters: IConverterRegistry,
  active: IActiveDataset
) {
  converters.register(nteractDataExplorerConverter);
  rendermime.addFactory(
    createTableDataFactory(async (dataset: Dataset<any>) => {
      data.publish(dataset);
      active.active = dataset.url;
      app.shell.activateById(dataExplorer.id);
    })
  );
}
