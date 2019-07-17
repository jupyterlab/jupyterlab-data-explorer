/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from "@jupyterlab/application";

import { Inspector } from "react-inspector";
import {
  ReactWidget,
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from "@jupyterlab/apputils";

import * as React from "react";
import { RegistryToken } from "./registry";
import { Registry, CachedObservable } from "@jupyterlab/dataregistry";
import { UseBehaviorSubject } from "./utils";

const id = "@jupyterlab/dataregistry-extension:data-debugger";

function Data({ data }: { data: unknown }) {
  if (data instanceof CachedObservable) {
    return (
      <UseBehaviorSubject subject={data.value}>
        {data_ => <Inspector data={data_} />}
      </UseBehaviorSubject>
    );
  }
  return <Inspector data={data} />;
}

function Debugger({ registry }: { registry: Registry }) {
  return (
    <div>
      <ol style={{ listStyle: "none" }}>
        <UseBehaviorSubject subject={registry.URLs$}>
          {urls =>
            [...urls].sort().map(url => (
              <li key={url}>
                <code>{url}</code>
                <ol style={{ listStyle: "none" }}>
                  {[...registry.getURL(url).entries()].map(
                    ([mimeType, [cost, data]]) => (
                      <li key={mimeType}>
                        <code>{mimeType}</code>
                        <Data data={data} />
                      </li>
                    )
                  )}
                </ol>
              </li>
            ))
          }
        </UseBehaviorSubject>
      </ol>
    </div>
  );
}
/**
 * Adds a visual data debugger.
 */
export default {
  activate,
  id,
  requires: [RegistryToken, ILayoutRestorer, ICommandPalette],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  app: JupyterFrontEnd,
  registry: Registry,
  restorer: ILayoutRestorer,
  palette: ICommandPalette
): void {
  // Declare a widget variable
  let widget: MainAreaWidget<ReactWidget>;

  // Add an application command
  const command: string = "dataregistry-debugger:open";
  app.commands.addCommand(command, {
    label: "Data Debugger",
    execute: () => {
      if (!widget) {
        // Create a new widget if one does not exist
        const content = ReactWidget.create(<Debugger registry={registry} />);
        widget = new MainAreaWidget({ content });
        widget.id = "dataregistry-debugger";
        widget.title.label = "Data Debugger";
        widget.title.closable = true;
      }
      if (!tracker.has(widget)) {
        // Track the state of the widget for later restoration
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.add(widget, "main");
      }
      widget.content.update();

      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({ command, category: "Data Registry" });

  // Track and restore the widget state
  let tracker = new WidgetTracker<MainAreaWidget<ReactWidget>>({
    namespace: "dataregistry-debugger"
  });
  restorer.restore(tracker, {
    command,
    name: () => "dataregistry-debugger"
  });
}
