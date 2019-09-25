/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";
import {
  WidgetTracker,
  MainAreaWidget,
  ReactWidget
} from "@jupyterlab/apputils";
import {
  DataType,
  DataTypeStringArg,
  Registry,
  URL_,
  createConverter
} from "@jupyterlab/dataregistry";
import { Widget } from "@phosphor/widgets";
import * as React from "react";
import { viewerDataType } from "./viewers";
import { IRegistry } from "./registry";
import { Subscription } from "rxjs";
import { first } from "rxjs/operators";

const tracker = new WidgetTracker<DataWidget>({ namespace: "dataregistry" });
const commandID = "dataregistry:view-url";

export const widgetDataType = new DataTypeStringArg<() => Widget>(
  "application/x.jupyter.widget",
  "label"
);

export interface IHasURL_ {
  url: URL_;
}

export function hasURL_(t: any): t is IHasURL_ {
  return "url" in t;
}

class DataWidget extends MainAreaWidget implements IHasURL_ {
  constructor(
    registry: Registry,
    content: Widget,
    public url: URL_,
    public label: string
  ) {
    super({ content });
    this.id = JSON.stringify([label, url.toString()]);
    this.title.closable = true;
    this.title.label = `${label}: ${url}`;

    this.subscription = registry.externalURL(url).subscribe({
      next: externalURL => {
        this.title.label =
          externalURL === url
            ? `${label}: ${url}`
            : `${label}: ${url} (${externalURL})`;
        this.externalURL = externalURL;
        tracker.save(this);
      }
    });
  }

  dispose() {
    this.subscription.unsubscribe();
    super.dispose();
  }

  externalURL: URL_ | null = null;
  subscription: Subscription;
}

const wrappedWidgetDataType = new DataTypeStringArg<() => DataWidget>(
  "application/x.jupyter.wrapped-widget",
  "label"
);

export const reactDataType: DataType<
  string,
  React.ReactElement<any>
> = new DataTypeStringArg<React.ReactElement<any>>(
  "application/x.jupyter.react",
  "label"
);

export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:widgets",
  requires: [ILabShell, IRegistry, ILayoutRestorer],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry,
  restorer: ILayoutRestorer
) {
  registry.addConverter(
    createConverter(
      { from: widgetDataType, to: wrappedWidgetDataType },
      ({ type, url, data }) => ({
        type,
        data: () => new DataWidget(registry, data(), url.toString(), type)
      })
    ),
    createConverter(
      { from: reactDataType, to: widgetDataType },
      ({ data, type }) => ({ type, data: () => ReactWidget.create(data) })
    ),
    createConverter(
      { from: wrappedWidgetDataType, to: viewerDataType },
      ({ data, type }) => ({
        type,
        data: () => {
          const widget = data();
          if (!tracker.has(widget)) {
            tracker.add(widget);
          }
          if (!widget.isAttached) {
            labShell.add(widget, "main");
          }
          widget.content.update();
          app.shell.activateById(widget.id);
        }
      })
    )
  );

  app.commands.addCommand(commandID, {
    execute: async args => {
      const url = args.url as string;
      const label = args.label as string;
      viewerDataType
        .filterDataset(
          registry.getURL(
            await registry
              .internalURL(url)
              .pipe(first())
              .toPromise()
          )
        )
        .get(label)!();
    }
  });

  restorer.restore(tracker, {
    name: widget => JSON.stringify([widget.label, widget.externalURL]),
    command: commandID,
    args: (
      widget
    ): {
      label: string;
      url: string;
    } => ({ label: widget.label, url: widget.externalURL! })
  });
}
