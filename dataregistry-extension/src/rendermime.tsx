/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------

This module creates a rendermime factory for `x.jupyter.relative-dataset-urls+json` outputs
to show them in a list.
*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import { relativeNestedDataType, Registry } from "@jupyterlab/dataregistry";
import { IActiveDataset } from "./active";
import { IRenderMimeRegistry, IRenderMime } from "@jupyterlab/rendermime";
import { ReactWidget } from "@jupyterlab/apputils";
import { RegistryToken } from "./registry";
import * as React from "react";
import { OutputArea } from "@jupyterlab/outputarea";
import { PanelLayout, Panel } from "@phosphor/widgets";
import { CodeCell } from "@jupyterlab/cells";
import { Notebook, NotebookPanel } from "@jupyterlab/notebook";
import { DatasetCompononent } from "./explorer";

const mimeType = relativeNestedDataType.createMimeType();

/**
 * This is a hack to figure out the context of our rendering. It will break if not rendering in a notebook
 * 
 * https://gitter.im/jupyterlab/jupyterlab?at=5d39c1816ece3c31b3f9c9ba
 */
function getURLOfRenderer(w: Renderer): URL {
  const panel = w.parent as Panel;
  const outputArea = panel.parent as OutputArea;
  const outputID = (outputArea.layout as PanelLayout).widgets.indexOf(panel);
  const outputAreaPanel = outputArea.parent as Panel;
  const codeCell = outputAreaPanel.parent as CodeCell;
  const notebook = codeCell.parent as Notebook;
  const cellID = (notebook.layout as PanelLayout).widgets.indexOf(codeCell);
  const notebookPanel = notebook.parent as NotebookPanel;
  const filePath = notebookPanel.context.path;

  return new URL(
    `${filePath}#/cells/${cellID}/outputs/${outputID}/data/${mimeType}`,
    "file:"
  );
}
class Renderer extends ReactWidget implements IRenderMime.IRenderer {
  constructor(private _active: IActiveDataset, private _registry: Registry) {
    super();
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {}

  render() {
    return (
      <DatasetCompononent
        parentURL={""}
        url={this._url!.toString()}
        active$={this._active}
        registry={this._registry}
      />
    );
  }
  onBeforeAttach() {
    this._url = getURLOfRenderer(this);
  }
  private _url: URL | undefined;
}
function activate(
  _: JupyterFrontEnd,
  rendermime: IRenderMimeRegistry,
  active: IActiveDataset,
  registry: Registry
) {
  rendermime.addFactory({
    safe: true,
    mimeTypes: [mimeType],
    createRenderer: () => new Renderer(active, registry)
  });
}

export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:rendermime",
  requires: [IRenderMimeRegistry, IActiveDataset, RegistryToken],
  autoStart: true
} as JupyterFrontEndPlugin<void>;
