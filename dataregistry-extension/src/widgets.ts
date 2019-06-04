/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from "@jupyterlab/application";
import { InstanceTracker } from "@jupyterlab/apputils";
import { Widget } from "@phosphor/widgets";

const tracker = new InstanceTracker({ namespace: "dataregistry" });
const commandID = "dataregistry:view-url";

import { MainAreaWidget } from "@jupyterlab/apputils";
import { map } from "rxjs/operators";
import { View, viewerDataType } from "./viewers";
import {
  DataTypeStringArg,
  URL_,
  Converter,
  Registry,
  createResolveDataset
} from "@jupyterlab/dataregistry";

/**
 * A function that creates a widget for the data.
 */
export type WidgetCreator = () => Promise<Widget>;

export const widgetDataType = new DataTypeStringArg<WidgetCreator>(
  "application/x.jupyter.widget",
  "label"
);

export function extractWidgetArgs(
  widget: Widget
): {
  label: string;
  url: string;
} {
  const [label, url] = JSON.parse(widget.id);
  return { label, url };
}

export interface IHasURL_ {
  url: URL_;
}

export function hasURL_(t: any): t is IHasURL_ {
  return "url" in t;
}

class DataWidget extends MainAreaWidget implements IHasURL_ {
  constructor(content: Widget, url: URL_, label: string) {
    super({ content });
    this.id = JSON.stringify([label, url]);
    this.title.label = `${label}: ${url}`;
    this.title.closable = true;
    this.url = url;
  }
  url: URL_;
}

export type WrappedWidgetCreator = () => Promise<DataWidget>;

export const wrappedWidgetDataType = new DataTypeStringArg<
  WrappedWidgetCreator
>("application/x.jupyter.wrapped-widget", "label");

export const wrapWidgetConverter = widgetDataType.createSingleTypedConverter(
  wrappedWidgetDataType,
  (label, url) => {
    return [
      label,
      [
        1,
        map(creator => async () => new DataWidget(await creator(), url, label))
      ]
    ];
  }
);

export function widgetViewerConverter(
  display: (widget: Widget) => Promise<void>
): Converter<WrappedWidgetCreator, View> {
  return wrappedWidgetDataType.createSingleTypedConverter(
    viewerDataType,
    label => [label, [1, map(creator => async () => display(await creator()))]]
  );
}

export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:widgets",
  requires: [ILabShell, Registry, ILayoutRestorer],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry,
  restorer: ILayoutRestorer
) {
  registry.addConverter(wrapWidgetConverter);
  registry.addConverter(
    widgetViewerConverter(async (widget: Widget) => {
      if (!tracker.has(widget)) {
        await tracker.add(widget);
      }
      if (!widget.isAttached) {
        labShell.add(widget, "main");
      }
      app.shell.activateById(widget.id);
    })
  );

  app.commands.addCommand(commandID, {
    execute: async args => {
      const url = args.url as string;
      const label = args.label as string;
      const disposable = registry.addDatasets(createResolveDataset(url));
      try {
        viewerDataType.getData$(registry.datasets$, url, label);
        await registry.viewURL_(url, args.label as string);
      } catch (e) {
        console.warn(`Could not load dataset ${url}`, e);
        if (disposable) {
          disposable.dispose();
        }
      }
    },
    label: args => `${args.label} ${args.url}`
  });

  restorer.restore(tracker, {
    name: (widget: Widget) => widget.id,
    command: commandID,
    args: extractWidgetArgs
  });
}
