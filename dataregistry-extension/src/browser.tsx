import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from "@jupyterlab/application";
import { ReactWidget } from "@jupyterlab/apputils";
import { Registry } from "@jupyterlab/dataregistry";

import * as React from "react";
import { IRegistry } from "./registry";
import { widgetDataType } from "./widgets";
import { IActiveDataset } from ".";
import { Widget } from "@phosphor/widgets";
import { PhosphorWidget } from "./utils";

function Browser({
  registry,
  active
}: {
  registry: Registry;
  active: IActiveDataset;
}) {
  const [url, setURL] = React.useState(active.value || "");
  const [label, setLabel] = React.useState("Grid");
  const [submittedURL, setSubmittedURL] = React.useState(url);
  const [follow, setFollow] = React.useState(true);
  const [widget, setWidget] = React.useState<Widget | undefined>(undefined);
  const [widgets, setWidgets] = React.useState(new Map<string, () => Widget>());

  React.useEffect(() => {
    setWidgets(
      submittedURL
        ? widgetDataType.filterDataset(registry.getURL(submittedURL))
        : new Map<string, () => Widget>()
    );
  }, [submittedURL, registry]);

  const widgetLabels = [...widgets.keys()];

  React.useEffect(() => {
    // If the current label is not in the widget labels, and there is a first widget label
    // set the current label to that
    if (!new Set(widgetLabels).has(label) && widgetLabels.length) {
      setLabel(widgetLabels[0]);
    }
  }, [widgets, label]);

  React.useEffect(() => {
    if (!widgets || !label) {
      setWidget(undefined);
      return;
    }
    const widgetCreator = widgets.get(label);
    if (widgetCreator) {
      setWidget(widgetCreator());
      return;
    }
    setWidget(undefined);
  }, [submittedURL, label, registry]);

  React.useEffect(() => {
    if (follow) {
      const subscription = active.subscribe({
        next: value => {
          setURL(value || "");
          setSubmittedURL(value || "");
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [active, follow]);

  return (
    <div style={{ height: "100%", display: "flex", flexFlow: "column" }}>
      <select value={label} onChange={event => setLabel(event.target.value)}>
        {widgetLabels.map(label => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>
      <form
        onSubmit={event => {
          setSubmittedURL(url);
          event.preventDefault();
        }}
      >
        <input
          type="text"
          value={url}
          placeholder="file:///data.csv"
          onChange={event => setURL(event.target.value)}
        />
        <input type="submit" value="Submit" />
      </form>
      <label>
        Follow active?
        <input
          type="checkbox"
          checked={follow}
          onChange={e => {
            if (e.target.checked) {
              setURL(active.value || "");
            }
            setFollow(e.target.checked);
          }}
        />
      </label>
      {widget ? <PhosphorWidget widget={widget} /> : "None"}
    </div>
  );
}

export default {
  activate,
  id: "@jupyterlab/dataregistry-extension:browser",
  requires: [ILabShell, IRegistry, ILayoutRestorer, IActiveDataset],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry,
  restorer: ILayoutRestorer,
  active: IActiveDataset
): void {
  const content = ReactWidget.create(
    <Browser registry={registry} active={active} />
  );
  content.id = "@jupyterlab-dataregistry/browser";
  content.title.iconClass = "jp-SpreadsheetIcon jp-SideBar-tabIcon";
  content.title.caption = "Data Browser";

  restorer.add(content, content.id);
  labShell.add(content, "right");
}
