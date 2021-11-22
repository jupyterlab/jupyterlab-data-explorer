import { Widget } from '@lumino/widgets';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { ITranslator } from '@jupyterlab/translation';
import { JSONObject } from '@lumino/coreutils';
import registry from '@jupyterlab/dataregistry/lib/dataregistry';
import { CommandIds } from './commands';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/vnd.jupyter.dataset';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-dataset';

/**
 * A widget for rendering dataset.
 */
export class DatasetWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
  }

  translator?: ITranslator;

  /**
   * Render dataset into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const data = model.data[this._mimeType] as JSONObject;
    this.node.textContent =
      typeof data === 'string' ? data : JSON.stringify(data);
    const datasets = Array.isArray(data)
      ? data
      : [typeof data === 'string' ? JSON.parse(data) : data];
    datasets.forEach((dataset) => {
      try {
        registry.registerCommand(
          CommandIds.view,
          dataset.abstractDataType,
          dataset.serializationType,
          dataset.storageType
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        registry.registerDataset(dataset);
        // eslint-enable-next-line @typescript-eslint/ban-ts-comment
        alert(`Successfully registered dataset ${dataset.id}`);
      } catch (e) {
        console.log(e.message);
      }
    });
    return Promise.resolve();
  }

  private _mimeType: string;
}

/**
 * A mime renderer factory for dataset data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: (options) => new DatasetWidget(options),
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: '@jupyterlab/dataset-extension:factory',
  rendererFactory,
  rank: 100,
  dataType: 'json',
  fileTypes: [
    {
      name: 'dataset',
      mimeTypes: [MIME_TYPE],
      extensions: ['.dataset'],
    },
  ],
  documentWidgetFactoryOptions: {
    name: 'dataset-viewer',
    primaryFileType: 'dataset',
    fileTypes: ['dataset'],
    defaultFor: ['dataset'],
  },
};

export default extension;
