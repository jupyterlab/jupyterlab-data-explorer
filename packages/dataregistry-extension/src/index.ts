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
import { spreadsheetIcon } from '@jupyterlab/ui-components';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JSONValue } from '@jupyterlab/dataregistry/lib/json';
import { Model } from './model';
import { getTemplate } from './templates';
import { ElementExt } from '@lumino/domutils';

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
    registerDatasets();
    const model = new Model();
    const panel = new DatasetPanel({
      datasets: registry.queryDataset(),
      model,
    });
    panel.title.icon = spreadsheetIcon;

    panel.title.caption = trans.__('Dataset Registry');
    panel.node.setAttribute('role', 'region');
    panel.node.setAttribute('aria-label', trans.__('Dataset Registry'));
    labShell.add(panel, 'left');

    app.commands.addCommand('dataregistry:view-dataset', {
      label: 'View dataset',
      caption: 'Adds code to view dataset in a new cell',
      execute: (args) => {
        if (notebookTracker) {
          const widget = notebookTracker.currentWidget;
          const notebook = widget!.content;
          if (notebook.model) {
            const state = {
              wasFocused: notebook.node.contains(document.activeElement),
              activeCell: notebook.activeCell,
            };
            const nbModel = notebook.model;
            const cell = nbModel.contentFactory.createCodeCell({
              cell: {
                cell_type: 'code',
                source: getTemplate(model.dataset),
                metadata: {},
              },
            });
            nbModel.cells.insert(notebook.activeCellIndex + 1, cell);
            notebook.activeCellIndex++;
            notebook.deselectAll();
            const { activeCell, node } = notebook;

            if (state.wasFocused || notebook.mode === 'edit') {
              notebook.activate();
            }
            ElementExt.scrollIntoViewIfNeeded(node, activeCell!.node);
          }
        }
      },
    });

    const datasets = registry.queryDataset();
    for (const dataset of datasets) {
      const { abstractDataType, serializationType, storageType } = dataset;
      const commands = registry.getCommands(
        abstractDataType,
        serializationType,
        storageType
      );
      for (const command of commands) {
        app.contextMenu.addItem({
          selector: `.jp-Dataset-list-item[data-adt=${abstractDataType}][data-sert=${serializationType}][data-stot=${storageType}]`,
          command: command,
        });
      }
    }
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

  registry.registerCommand(
    'dataregistry:view-dataset',
    'tabular',
    'csv',
    'inmemory'
  );

  registry.registerDataset<JSONValue, IS3CSVMetadata>({
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
  });

  registry.registerCommand('dataregistry:view-dataset', 'tabular', 'csv', 's3');
}
