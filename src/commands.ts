import { getCreateTemplate, getTemplate } from './templates';
import { ElementExt } from '@lumino/domutils';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IDatasetListingModel } from './model';
import registry, { IDataRegistry } from './dataregistry';
import { CsvViewer, CsvWidget } from './csv-widget';
import { Dataset } from './dataset';
import { JSONValue } from '@lumino/coreutils';

export const CommandIds = {
  view: 'dataregistry:view-dataset',
  create: 'dataregistry:create-dataset',
  opencsv: 'dataregistry:open-with-csv-viewer',
  openhuggingface: 'dataregistry:open-huggingface',
};

export const addCommandsAndMenu = async (
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

  const addCommands = async (registry: IDataRegistry, dataset: Dataset<any, any>) => {
    const { abstractDataType, serializationType, storageType } = dataset;
    const commands = await registry.getCommands(
      abstractDataType,
      serializationType,
      storageType
    );
    for (const command of commands) {
      app.contextMenu.addItem({
        selector: [
          `.jp-Dataset-list-item`,
          `[data-adt=${abstractDataType}]`,
          `[data-sert=${serializationType}]`,
          `[data-stot=${storageType}]`
        ].join(""),
        command: command,
      });
    }
  }

  // Add menus for datasets that are already registered
  const datasets = await registry.queryDataset();
  datasets.forEach(async (dataset) => {
    addCommands(registry, dataset);
  });

  // Add menus for datasets that are registered later in the UI
  registry.datasetAdded.connect(async (registry, dataset) => {
    addCommands(registry, dataset);
  });
};
