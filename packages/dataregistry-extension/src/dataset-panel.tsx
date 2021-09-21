import { Dataset } from '@jupyterlab/dataregistry';
import { DatasetListComponent } from './dataset-list';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { DatasetSearchComponent } from './dataset-search';
import { DatasetAddComponent } from './dataset-add';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ElementExt } from '@lumino/domutils';
import { getTemplate } from './templates';

export class DatasetPanel extends ReactWidget {
  readonly _datasets: Dataset<any, any>[];
  readonly _title?: string;
  readonly _description?: string;
  readonly _notebookTracker?: INotebookTracker;
  readonly _app?: JupyterFrontEnd;
  constructor(options: DatasetPanel.IOptions) {
    super();
    this.addClass('jp-dataset-panel');
    this.id = 'dataset-panel';
    this._datasets = options.datasets;
    this._notebookTracker = options.notebookTracker;
    this._app = options.app;
    this._title = options.title ?? 'Data Panel';
    this._description =
      options.description ??
      'Add and view data associated with your notebooks.';
  }

  render(): JSX.Element {
    const clickHandler = (dataset: Dataset<any, any>) => {
      if (this._notebookTracker) {
        const widget = this._notebookTracker.currentWidget;
        const notebook = widget!.content;
        if (notebook.model) {
          const state = {
            wasFocused: notebook.node.contains(document.activeElement),
            activeCell: notebook.activeCell,
          };
          const model = notebook.model;
          const cell = model.contentFactory.createCodeCell({
            cell: {
              cell_type: 'code',
              source: getTemplate(dataset),
              metadata: {},
            },
          });
          model.cells.insert(notebook.activeCellIndex + 1, cell);
          notebook.activeCellIndex++;
          notebook.deselectAll();
          const { activeCell, node } = notebook;

          if (state.wasFocused || notebook.mode === 'edit') {
            notebook.activate();
          }
          ElementExt.scrollIntoViewIfNeeded(node, activeCell!.node);
        }
      }
    };

    return (
      <div>
        <h2>{this._title}</h2>
        <p>{this._description}</p>
        <DatasetSearchComponent />
        <DatasetAddComponent onClick={(e: any) => clickHandler(e)} />
        <DatasetListComponent
          datasets={this._datasets}
          onClick={clickHandler}
        />
      </div>
    );
  }
}

namespace DatasetPanel {
  export interface IOptions {
    title?: string;
    description?: string;
    datasets: Dataset<any, any>[];
    notebookTracker?: INotebookTracker;
    app?: JupyterFrontEnd;
  }
}
