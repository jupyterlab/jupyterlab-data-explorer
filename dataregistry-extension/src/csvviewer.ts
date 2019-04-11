import { widgetDataType, IDataRegistry } from '@jupyterlab/dataregistry';
import { DataGrid } from '@phosphor/datagrid';
import { DSVModel } from '@jupyterlab/csvviewer';
import { DataTypeNoArgs } from '@jupyterlab/dataregistry/lib/datatype';
import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

export const CSVDataType = new DataTypeNoArgs<string>('text/csv');

export const CSVConverter = CSVDataType.createSingleTypedConverter(
  widgetDataType,
  () => [
    'Grid',
    async (data: string) => async () => {
      // Copies the default grid setup from `widget.ts`
      // It would be great to use `CSVViewer` itself,
      // But it assumes a model that changes over time, whereas
      // we just have a static string.
      const grid = new DataGrid({
        baseRowSize: 24,
        baseColumnSize: 144,
        baseColumnHeaderSize: 36,
        baseRowHeaderSize: 64
      });
      grid.headerVisibility = 'all';
      grid.model = new DSVModel({ data, delimiter: ',' });
      return grid;
    }
  ]
);

const id = '@jupyterlab/dataregistry-extension:csv-viewer';

export default {
  activate,
  id,
  requires: [IDataRegistry],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  app: JupyterFrontEnd,
  dataRegistry: IDataRegistry,
): void {
  dataRegistry.converters.register(CSVConverter);
}
