/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from "@jupyterlab/application";
import { DocumentWidget } from "@jupyterlab/docregistry";
import { Widget } from "@phosphor/widgets";
import { BehaviorSubject } from "rxjs";
import { URL_, Registry, nestedDataType } from "@jupyterlab/dataregistry";
import { hasURL_ } from "./widgets";
import { Token } from "@phosphor/coreutils";
import { RegistryToken } from "./registry";
import { map } from "rxjs/operators";

export interface IActiveDataset extends BehaviorSubject<URL_ | null> {}
export const IActiveDataset = new Token<IActiveDataset>(
  "@jupyterlab/dataregistry:IActiveDataset"
);

export const ACTIVE_URL = new URL("active:").toString();
/**
 * The active dataset extension.
 */
export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:active-dataset",
  requires: [ILabShell, RegistryToken],
  provides: IActiveDataset,
  autoStart: true
} as JupyterFrontEndPlugin<IActiveDataset>;

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry
): IActiveDataset {
  const active = new BehaviorSubject<URL_ | null>(null);

  // Show active datasets in explorerr
  registry.addDatasets(
    nestedDataType.createDatasets(
      ACTIVE_URL,
      active.pipe(map(url => (url ? new Set([url]) : new Set())))
    )
  );

  // Track active documents open.
  labShell.currentChanged.connect((sender, args) => {
    active.next(getURL_(args.newValue));
  });
  return active;
}

function getURL_(widget: Widget | null): URL_ | null {
  if (widget === null) {
    return null;
  }
  if (isDocumentWidget(widget)) {
    return new URL(`file://${widget.context.session.path}`).toString();
  }
  if (hasURL_(widget)) {
    return widget.url;
  }
  return null;
}

function isDocumentWidget(widget: Widget): widget is DocumentWidget {
  return (widget as DocumentWidget).context !== undefined;
}
