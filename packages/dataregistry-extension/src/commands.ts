import { getCreateTemplate, getTemplate } from './templates';
import { ElementExt } from '@lumino/domutils';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IDatasetListingModel } from './model';
import registry from '@jupyterlab/dataregistry/lib/dataregistry';
import { CsvViewer, CsvWidget } from './csv-widget';
import { Dataset } from '@jupyterlab/dataregistry';
import { JSONValue } from '@lumino/coreutils';

export const CommandIds = {
  view: 'dataregistry:view-dataset',
  create: 'dataregistry:create-dataset',
  opencsv: 'dataregistry:open-with-csv-viewer',
  openhuggingface: 'dataregistry:open-huggingface',
};

export const addCommandsAndMenu = (
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker,
  model: IDatasetListingModel
) => {
  app.commands.addCommand(CommandIds.view, {
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
              source: getTemplate(model.selectedDataset!),
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

  app.commands.addCommand(CommandIds.create, {
    label: 'View dataset',
    caption: 'Adds code to view dataset in a new cell',
    execute: (args) => {
      if (notebookTracker) {
        notebookTracker;
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
              source: getCreateTemplate(),
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

  app.commands.addCommand(CommandIds.opencsv, {
    label: 'Open with CsvViewer',
    execute: () => {
      app.shell.add(
        new CsvWidget(
          model.selectedDataset as unknown as Dataset<
            JSONValue,
            CsvViewer.IMetadata
          >
        ),
        'main'
      );
    },
  });

  // Add menus for datasets
  registry.datasetAdded.connect((registry, dataset) => {
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
  });
};
