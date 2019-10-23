/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import * as React from 'react';
import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import {
  Registry,
  relativeNestedDataType,
  nestedDataType,
  URL_
} from '@jupyterlab/dataregistry';
import { IRegistry } from '@jupyterlab/dataregistry-registry-extension';
import { Widget } from '@phosphor/widgets';
import { widgetDataType, reactDataType } from './widgets';
import { IActiveDataset } from '.';
import { PhosphorWidget } from './utils';
import { Observable } from 'rxjs';

function InnerBrowser({ registry, url }: { registry: Registry; url: URL_ }) {
  // An array of all possible child paths after the last selected one
  const [children, setChildren] = React.useState<Array<string>>([]);
  // An observable of all the children we have
  const [children$, setChildren$] = React.useState<
    Observable<Set<string> | Array<string>> | undefined
  >(undefined);
  // The current display label to use, if it exists on the current widget
  const [label, setLabel] = React.useState('');
  // The current display creators for the submitted URL
  const [widgets, setWidgets] = React.useState(new Map<string, () => Widget>());
  // The current display creators for the submitted URL
  const [components, setComponents] = React.useState(
    new Map<string, React.ReactElement<any>>()
  );

  // Set the children to be all possible children.
  React.useEffect(() => {
    setChildren$(
      url
        ? relativeNestedDataType.getDataset(registry.getURL(url)) ||
            nestedDataType.getDataset(registry.getURL(url))
        : undefined
    );
  }, [url, registry]);

  // Set the children to the subscribed children
  React.useEffect(() => {
    if (children$) {
      const subscription = children$.subscribe({
        next: value => {
          setChildren([...value]);
        }
      });
      return () => subscription.unsubscribe();
    }
    setChildren([]);
  }, [children$]);

  // Update the available widgets whenever the url changes
  React.useEffect(() => {
    const dataset = url && registry.getURL(url);
    setWidgets(dataset ? widgetDataType.filterDataset(dataset) : new Map());
    setComponents(dataset ? reactDataType.filterDataset(dataset) : new Map());
  }, [url, registry]);

  // Fill in options mapping
  const options = new Map<string, { value: string; type: 'child' | 'view' }>();

  for (const key of widgets.keys()) {
    options.set(`view-${key}`, { value: key, type: 'view' });
  }
  for (const child of children) {
    options.set(`child-${child}`, {
      value: child,
      type: 'child'
    });
  }

  const parsedLabel = options.get(label);

  // update the label to be the first one in the options, if there are some options
  // and the current label is not in them
  React.useEffect(() => {
    if (!options.has(label) && options.size) {
      setLabel(options.keys().next().value);
    }
  }, [label, widgets, children]);

  const Component: React.ReactElement<any> | undefined = React.useMemo(() => {
    const selected = options.get(label);
    if (!selected || selected.type === 'child') {
      return;
    }
    const name = selected.value;
    const widgetCreator = widgets.get(name);
    return (
      components.get(name) ||
      (widgetCreator && <PhosphorWidget widget={widgetCreator()} />)
    );
  }, [options, label, components, widgets]);
  // Use the widget creator to set the current widget

  return (
    <>
      <select value={label} onChange={event => setLabel(event.target.value)}>
        {[...options.entries()].map(([idx, { value, type }]) => (
          <option key={idx} value={idx}>
            {type === 'child' && value.startsWith(url)
              ? value.slice(url.length)
              : value}
          </option>
        ))}
      </select>
      {parsedLabel && parsedLabel.type === 'child' ? (
        <InnerBrowser
          registry={registry}
          url={new URL(parsedLabel.value, url).toString()}
        />
      ) : Component ? (
        Component
      ) : (
        'Select another dataset to view it...'
      )}
    </>
  );
}

function Browser({
  registry,
  active
}: {
  registry: Registry;
  active: IActiveDataset;
}) {
  // Current url in the form
  const [url, setURL] = React.useState(active.value || '');
  // Last url we have submitted
  const [submittedURL, setSubmittedURL] = React.useState(url);
  // Whether to update both urls whenever the active dataset changes
  const [follow, setFollow] = React.useState(true);

  // Update the URL when the active changes
  React.useEffect(() => {
    if (follow) {
      const subscription = active.subscribe({
        next: value => {
          setURL(value || '');
          setSubmittedURL(value || '');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [active, follow]);

  return (
    <div className="jl-dr-browser">
      <form
        onSubmit={event => {
          setSubmittedURL(url);
          event.preventDefault();
        }}
        className="jl-dr-browser-url"
      >
        <input
          type="text"
          value={url}
          placeholder="file:///data.csv"
          onChange={event => setURL(event.target.value)}
          className="jl-dr-browser-url-text"
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
              setURL(active.value || '');
            }
            setFollow(e.target.checked);
          }}
        />
      </label>
      <InnerBrowser registry={registry} url={submittedURL} />
    </div>
  );
}

export default {
  activate,
  id: '@jupyterlab/dataregistry-extension:browser',
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
  content.id = '@jupyterlab-dataregistry/browser';
  content.title.iconClass = 'jp-SpreadsheetIcon jp-SideBar-tabIcon';
  content.title.caption = 'Data Browser';

  restorer.add(content, content.id);
  labShell.add(content, 'right');
}
