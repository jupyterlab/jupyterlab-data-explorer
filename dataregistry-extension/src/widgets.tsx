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

import * as React from "react";

import { Observable, Subscription } from "rxjs";

interface IUseObservableProps<T, U> {
  observable: Observable<T>;
  initial: U;
  children: (value: T | U) => React.ReactNode;
}
export class UseObservable<T, U> extends React.Component<
  IUseObservableProps<T, U>,
  { value: T | U }
> {
  private subscription!: Subscription;
  constructor(props: IUseObservableProps<T, U>) {
    super(props);
    this.state = { value: props.initial };
  }

  componentDidMount() {
    this.subscription = this.props.observable.subscribe({
      next: value => this.setState({ value })
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return this.props.children(this.state.value);
  }
}

import { InstanceTracker, ReactWidget } from "@jupyterlab/apputils";
import { Widget } from "@phosphor/widgets";

const tracker = new InstanceTracker({ namespace: "dataregistry" });
const commandID = "dataregistry:view-url";

import { MainAreaWidget } from "@jupyterlab/apputils";
import { viewerDataType } from "./viewers";
import {
  DataTypeStringArg,
  URL_,
  Registry,
  DataType
} from "@jupyterlab/dataregistry";

export const widgetDataType = new DataTypeStringArg<Widget>(
  "application/x.jupyter.widget",
  "label"
);

function extractWidgetArgs(
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

const wrappedWidgetDataType = new DataTypeStringArg<DataWidget>(
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
  requires: [ILabShell, Registry, ILayoutRestorer],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry,
  restorer: ILayoutRestorer
) {
  registry.addConverter(
    widgetDataType.createSingleTypedConverter(
      wrappedWidgetDataType,
      (label, url) => {
        return [label, widget => new DataWidget(widget, url, label)];
      }
    )
  );
  registry.addConverter(
    reactDataType.createSingleTypedConverter(widgetDataType, label => [
      label,
      ReactWidget.create
    ])
  );
  registry.addConverter(
    wrappedWidgetDataType.createSingleTypedConverter(viewerDataType, label => [
      label,
      widget => () => {
        if (!tracker.has(widget)) {
          tracker.add(widget);
        }
        if (!widget.isAttached) {
          labShell.add(widget, "main");
        }
        app.shell.activateById(widget.id);
      }
    ])
  );

  app.commands.addCommand(commandID, {
    execute: args => {
      const url = args.url as string;
      const label = args.label as string;
      viewerDataType.filterDataset(registry.getURL(url)).get(label)!();
    },
    label: args => `${args.label} ${args.url}`
  });

  restorer.restore(tracker, {
    name: (widget: Widget) => widget.id,
    command: commandID,
    args: extractWidgetArgs
  });
}
