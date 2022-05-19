import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { DatasetPanel } from './dataset-panel';
import { JSONObject, JSONValue } from '@lumino/coreutils';
import registry, {
  IDataRegistry,
} from './dataregistry';
import { spreadsheetIcon } from '@jupyterlab/ui-components';
import { INotebookTracker } from '@jupyterlab/notebook';
import { DatasetListingModel } from './model';
import { addCommandsAndMenu, CommandIds } from './commands';
import { Widget } from '@lumino/widgets';

/**
 * Initialization data for the @jupyterlab/dataregistry-extension extension.
 */
const plugin: JupyterFrontEndPlugin<IDataRegistry> = {
  id: '@jupyterlab/dataregistry-extension:plugin',
  autoStart: true,
  requires: [ISettingRegistry, ITranslator, ILabShell, INotebookTracker],
  activate: async (
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
            '@jupyterlab/dataregistry-extension settings loaded',
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

    const model = new DatasetListingModel(await registry.queryDataset());
    const panel = new DatasetPanel({
      model,
      app,
    });
    panel.title.icon = spreadsheetIcon;

    panel.title.caption = trans.__('Dataset Registry');
    panel.node.setAttribute('role', 'region');
    panel.node.setAttribute('aria-label', trans.__('Dataset Registry'));
    labShell.add(panel as unknown as Widget, 'left');

    await addCommandsAndMenu(app, labShell, notebookTracker, model, trans);
    
    // This should exist in a demo extension
    await registerDemoDatasets();
    await registerDemoCommands();

    return registry;
  },
};

export {IDataRegistry};

export default plugin;


// Move this to a demo extension
async function registerDemoCommands() {
  await registry.registerCommand(CommandIds.view, 'tabular', 'csv', 'inmemory');
  await registry.registerCommand(CommandIds.opencsv, 'tabular', 'csv', 'inmemory');
  await registry.registerCommand(CommandIds.view, 'tabular', 'csv', 's3');
  await registry.registerCommand(
    CommandIds.openhuggingface,
    'tabular',
    'csv',
    'huggingface'
  );
  registry.registerCommand(
    CommandIds.opensql,
    'tabular',
    'sql',
    'sqlite'
  );
}


// This should exist in a demo extension
async function registerDemoDatasets() {
  /*interface ICSVMetadata extends JSONObject {
    delimiter: string;
    lineDelimiter: string;
  }
  const CSV_CONTENT = 'header1,header2\nvalue1,value2';
  const datasetId = '1234567890';

  interface IS3CSVMetadata extends ICSVMetadata {
    bucket: string;
    filename: string;
  }

  await registry.registerDataset<JSONValue, ICSVMetadata>({
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

  await registry.registerDataset<JSONValue, IS3CSVMetadata>({
    id: 's3://bucket/filename',
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
  });*/

  interface IStockAAPLSqliteMeta extends JSONObject {
    location: string,
    table: string,
    cols: string[],
    query: string
  }

  registry.registerDataset<JSONValue, IStockAAPLSqliteMeta>({
    id: "aapl_stock_data",
    version: "1",
    abstractDataType: 'tabular',
    serializationType: "sql",
    storageType: 'sqlite',
    value: null,
    metadata: {
      location: "data/demodb.sqlite",
      table: "all_stocks",
      cols: [
        "data", "open", "high", "low", "close", "volume", "Name"
      ],
      query: "select * from all_stocks where Name = 'AAPL';"
    },
    title: "AAPL stock data",
    description: "AAPL stock data"
  }); 
}
