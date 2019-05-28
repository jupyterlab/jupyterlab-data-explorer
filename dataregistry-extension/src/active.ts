/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from '@jupyterlab/application';
import {
  IActiveDataset,
  ActiveDataset,
  createFileURL_,
  hasURL_
} from '@jupyterlab/dataregistry';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@phosphor/widgets';

/**
 * The active dataset extension.
 */
export default {
  activate,
  id: '@jupyterlab/dataregistry-extension:active-dataset',
  requires: [ILabShell],
  provides: IActiveDataset,
  autoStart: true
} as JupyterFrontEndPlugin<IActiveDataset>;

function activate(app: JupyterFrontEnd, labShell: ILabShell): IActiveDataset {
  const active = new ActiveDataset();

  // Track active documents open.
  labShell.currentChanged.connect((sender, args) => {
    active.active = getURL_(args.newValue);
  });
  return active;
}

function getURL_(widget: Widget | null): URL_ | null {
  if (widget === null) {
    return null;
  }
  if (isDocumentWidget(widget)) {
    return createFileURL_(widget.context.session.path);
  }
  if (hasURL_(widget)) {
    return widget.url;
  }
  return null;
}

function isDocumentWidget(widget: Widget): widget is DocumentWidget {
  return (widget as DocumentWidget).context !== undefined;
}
