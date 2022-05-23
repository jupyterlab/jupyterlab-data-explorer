import { getCreateTemplate, getTemplate } from './templates';
import { ElementExt } from '@lumino/domutils';
import { JupyterFrontEnd, ILabShell } from '@jupyterlab/application';
import { INotebookModel, INotebookTracker, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { IDatasetListingModel } from './model';
import registry, { IDataRegistry } from './dataregistry';
import { CsvViewer, CsvWidget } from './csv-widget';
import { Dataset } from './dataset';
import { JSONValue } from '@lumino/coreutils';
import { TranslationBundle } from '@jupyterlab/translation';
import { showErrorMessage } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

export const CommandIds = {
  view: 'dataregistry:view-dataset',
  create: 'dataregistry:create-dataset',
  opencsv: 'dataregistry:open-with-csv-viewer',
  openhuggingface: 'dataregistry:open-huggingface',
  opensql: 'dataregistry:open-sql'
};

export const addCommandsAndMenu = async (
  app: JupyterFrontEnd,
  labShell: ILabShell,
  notebookTracker: INotebookTracker,
  model: IDatasetListingModel,
  trans: TranslationBundle
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
        ) as unknown as Widget,
        'main'
      );
    },
  });

  app.commands.addCommand(CommandIds.opensql, {
    label: 'Open in SQL Notebook',
    caption: 'Opens a new notebook with xeus-sql kernel',
    execute: (args) => {
      // does it need a check if xeus-sql kernel is available
      app.commands.execute('notebook:create-new', {
          kernelName: "xsql"
      })
      .then((widget: NotebookPanel) => {
        if(widget instanceof NotebookPanel) {
          const dataset = model.selectedDataset;
          const notebook = widget!.content;
          widget.context.ready.then(() => {
            if (notebook.model) {
              const nbModel = notebook.model;
              notebook.mode = 'edit';
              addCodeCell(
                `%LOAD sqlite3 db="${dataset?.metadata.location}"`,
                nbModel,
                notebook
              );
              addCodeCell(
                dataset?.metadata.query,
                nbModel,
                notebook
              );
              notebook.deselectAll();
            }
          });
        } 
      })
      .catch(err => {
        void showErrorMessage(trans._p('Error', 'Launcher Error'), err);
      });
    }
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

  // Add menus for datasets that are registered later in the UI
  registry.datasetAdded.connect(async (registry, dataset) => {
    addCommands(registry, dataset);
  });

  const selectors = new Set();
  registry.commandAdded.connect(async (registry, command) => {
    const datasets = await registry.queryDataset();
    for (const dataset of datasets) {
      const { abstractDataType, serializationType, storageType } = dataset;
      const commands = await registry.getCommands(
        abstractDataType,
        serializationType,
        storageType
      );
      if(commands.has(command)) {
        const selector = [
          `.jp-Dataset-list-item`,
          `[data-adt=${abstractDataType}]`,
          `[data-sert=${serializationType}]`,
          `[data-stot=${storageType}]`,
          command
        ].join("");
        if(!selectors.has(selector)) {
          selectors.add(selector);
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
    }
  });

};


function addCodeCell(source: string, model: INotebookModel, notebook: Notebook) {
  const cell = model.contentFactory.createCodeCell({
    cell: {
      cell_type: 'code',
      source,
      metadata: {},
    },
  });
  model.cells.insert(notebook.activeCellIndex || 0, cell);
  notebook.activeCellIndex++;
}