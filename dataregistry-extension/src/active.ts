/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import {
  createConverter,
  nestedDataType,
  Registry,
  resolveDataType,
  URL_
} from "@jupyterlab/dataregistry";
import { IDocumentManager } from "@jupyterlab/docmanager";
import { Token } from "@phosphor/coreutils";
import { Widget } from "@phosphor/widgets";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { IRegistry } from "./registry";
import { hasURL_ } from "./widgets";

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
  requires: [ILabShell, IRegistry, IDocumentManager],
  provides: IActiveDataset,
  autoStart: true
} as JupyterFrontEndPlugin<IActiveDataset>;

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry,
  docManager: IDocumentManager
): IActiveDataset {
  const active = new BehaviorSubject<URL_ | null>(null);

  // Show active datasets in explorerr
  registry.addConverter(
    createConverter({ from: resolveDataType }, ({ url }) => {
      if (url.toString() !== ACTIVE_URL) {
        return null;
      }
      return {
        type: nestedDataType.createMimeType(),
        data: active.pipe(map(url => (url ? new Set([url]) : new Set())))
      };
    })
  );

  // Track active documents open.
  labShell.currentChanged.connect((sender, args) => {
    active.next(getURL_(docManager, args.newValue));
  });
  return active;
}

function getURL_(
  docManager: IDocumentManager,
  widget: Widget | null
): URL_ | null {
  if (widget === null) {
    return null;
  }
  const context = docManager.contextForWidget(widget);
  if (context) {
    return new URL(context.session.path, "file:").toString();
  }
  if (hasURL_(widget)) {
    return widget.url;
  }
  return null;
}
