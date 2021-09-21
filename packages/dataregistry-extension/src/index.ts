import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { DatasetPanel } from './dataset-panel';
import { JSONObject } from '@lumino/coreutils';
import registry from '@jupyterlab/dataregistry/lib/dataregistry';
import { buildIcon } from '@jupyterlab/ui-components';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JSONValue } from '@jupyterlab/dataregistry/lib/json';

/**
 * Initialization data for the @jupyterlab/dataregistry-extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/dataregistry-extension:plugin',
  autoStart: true,
  requires: [ISettingRegistry, ITranslator, ILabShell, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null,
    translator: ITranslator,
    labShell: ILabShell,
    notebookTracker: INotebookTracker
  ) => {
    console.log(
      'JupyterLab extension @jupyterlab/dataregistry-extension is activated!'
    );
    const trans = translator.load('jupyterlab');
    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then((settings) => {
          console.log(
            '@jupyterlab/dataregistry-extension settings loaded:',
            settings.composite
          );
        })
        .catch((reason) => {
          console.error(
            'Failed to load settings for @jupyterlab/dataregistry-extension.',
            reason
          );
        });
    }
    registerDatasets();
    const panel = new DatasetPanel({
      datasets: registry.queryDataset(),
      notebookTracker,
      app,
    });
    panel.title.icon = buildIcon;
    panel.title.caption = trans.__('Dataset Registry');
    panel.node.setAttribute('role', 'region');
    panel.node.setAttribute('aria-label', trans.__('Dataset Registry'));
    labShell.add(panel, 'left');
  },
};

export default plugin;

function registerDatasets() {
  interface ICSVMetadata extends JSONObject {
    delimiter: string;
    lineDelimiter: string;
  }
  const CSV_CONTENT = 'header1,header2\nvalue1,value2';
  const datasetId = '1234567890';

  interface IS3CSVMetadata extends ICSVMetadata {
    bucket: string;
    filename: string;
  }

  registry.registerDataset<JSONValue, ICSVMetadata>({
    id: datasetId,
    abstractDataType: 'tabular',
    serializationType: 'csv',
    storageType: 'inmemory',
    value: CSV_CONTENT,
    metadata: {
      delimiter: ',',
      lineDelimiter: '\n',
    },
    title: 'CSV In Memory Dataset',
    description: 'Dummy in memory dataset',
    version: '1.0',
  });

  registry.registerDataset<JSONValue, IS3CSVMetadata>({
    id: 's3://bucket/object',
    abstractDataType: 'tabular',
    serializationType: 'csv',
    storageType: 's3',
    value: null,
    metadata: {
      delimiter: ',',
      lineDelimiter: '\n',
      bucket: 'bucket',
      filename: 'filename',
    },
    title: 'CSV S3 Dataset',
    description: 'CSV in S3 dataset',
    version: '1.0',
  });
}
