/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import * as React from 'react';
import { Observable, of, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { classes } from 'typestyle';
import { Token } from '@phosphor/coreutils';
import { Widget } from '@phosphor/widgets';
import { ReactWidget } from '@jupyterlab/apputils';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer
} from '@jupyterlab/application';
import {
  Registry,
  URL_,
  ObservableSet,
  nestedDataType,
  DataTypeNoArgs,
  externalURLDataType
} from '@jupyterlab/dataregistry';
import { IRegistry } from '@jupyterlab/dataregistry-registry-extension';
import { IActiveDataset, ACTIVE_URL } from './active';
import { UseObservable } from './utils';
import { viewerDataType } from './viewers';

export const labelDataType = new DataTypeNoArgs<Observable<string>>(
  'application/x.jupyterlab.label'
);

function Button({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <button
      className="jl-explorer-button"
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
    >
      {text}
    </button>
  );
}

/**
 * Shows/hides the children based on a button
 */
class Collapsable extends React.Component<
  { children: React.ReactElement },
  { collapsed: boolean }
> {
  state: { collapsed: boolean } = {
    collapsed: true
  };

  render() {
    if (this.state.collapsed) {
      return (
        <Button
          onClick={() => this.setState({ collapsed: false })}
          text="Show"
        />
      );
    }
    return (
      <>
        <Button
          onClick={() => this.setState({ collapsed: true })}
          text="hide"
        />
        {this.props.children}
      </>
    );
  }
}

export function DatasetCompononent({
  url,
  parentURL,
  active$,
  registry
}: {
  url: URL_;
  parentURL: Observable<URL_>;
  registry: Registry;
  active$: IActiveDataset;
}) {
  const dataset = registry.getURL(url);
  const viewers = [...viewerDataType.filterDataset(dataset)];
  const nestedURLs = nestedDataType.filterDataset(dataset).get(undefined);
  // Sort viewers by label
  viewers.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  // Sort nested by URL
  if (viewers.length === 0 && nestedURLs === undefined) {
    return <></>;
  }
  return (
    <UseObservable observable={active$} initial={null}>
      {active => {
        const classNames = ['jl-explorer-dataset'];
        if (active === url) {
          classNames.push('jl-explorer-active-dataset');
        }

        const dataset = registry.getURL(url);
        // Use label if it exists
        let label = labelDataType.getDataset(dataset);
        const displayURL = externalURLDataType.getDataset(dataset) || of(url);
        // otherwise use url
        if (!label) {
          label = combineLatest(displayURL, parentURL).pipe(
            map(([u, parentU]) =>
              u.startsWith(parentU) ? u.slice(parentU.length) : u
            )
          );
        }
        return (
          <div
            className={classes(...classNames)}
            onClick={e => {
              e.stopPropagation();
              active$.next(url);
            }}
          >
            <h3 className="jl-explorer-dataset-name">
              <UseObservable observable={label} initial="">
                {label_ => label_}
              </UseObservable>
            </h3>
            <span>
              {viewers.map(([label, view]) => (
                <Button key={label} onClick={view} text={label} />
              ))}
            </span>
            {nestedURLs ? (
              <Collapsable>
                <DatasetsComponent
                  url={displayURL}
                  active={active$}
                  registry={registry}
                  urls$={nestedURLs}
                />
              </Collapsable>
            ) : (
              undefined
            )}
          </div>
        );
      }}
    </UseObservable>
  );
}

function DatasetsComponent({
  active,
  registry,
  urls$,
  url
}: {
  active: IActiveDataset;
  registry: Registry;
  urls$: Observable<Set<URL_>>;
  url: Observable<URL_>;
}) {
  return (
    <UseObservable observable={urls$} initial={undefined}>
      {urls =>
        urls ? (
          [...urls]
            .sort()
            .map(innerURL => (
              <DatasetCompononent
                key={innerURL}
                url={innerURL}
                parentURL={url}
                registry={registry}
                active$={active}
              />
            ))
        ) : (
          <div>loading...</div>
        )
      }
    </UseObservable>
  );
}

function Heading({
  search,
  onSearch
}: {
  search: string;
  onSearch: (search: string) => void;
}) {
  return (
    <h2 className="jl-explorer-heading">
      Datasets
      {/* <input
        type="text"
        placeholder="Search..."
        style={{ marginLeft: 12 }}
        className={classes(Classes.INPUT, Classes.SMALL)}
        value={search}
        onChange={event => onSearch(event.target.value)}
      /> */}
    </h2>
  );
}

class DataExplorer extends React.Component<
  {
    registry: Registry;
    active: IActiveDataset;
    urls$: Observable<Set<URL_>>;
  },
  { search: string }
> {
  state: { search: string } = {
    search: ''
  };

  render() {
    return (
      <div className="jl-explorer">
        <Heading
          search={this.state.search}
          onSearch={(search: string) => this.setState({ search })}
        />
        <div className="jl-explorer-body">
          <DatasetsComponent
            url={of('')}
            registry={this.props.registry}
            active={this.props.active}
            urls$={this.props.urls$}
          />
        </div>
      </div>
    );
  }
}

/* tslint:disable */
export const IDataExplorer = new Token<IDataExplorer>(
  '@jupyterlab/dataRegistry:IDataExplorer'
);

export interface IDataExplorer {
  widget: Widget;

  /**
   * Adds a URL to display on the top level of the data explorer.
   */
  addURL(url: URL_): void;

  /**
   * Removes a URL from the top level of the data explorer.
   */
  removeURL(url: URL_): void;
}

const id = '@jupyterlab/dataregistry-extension:data-explorer';
/**
 * Adds a visual data explorer to the sidebar.
 */
export default {
  activate,
  id,
  requires: [ILabShell, IRegistry, ILayoutRestorer, IActiveDataset],
  provides: IDataExplorer,
  autoStart: true
} as JupyterFrontEndPlugin<IDataExplorer>;

function activate(
  lab: JupyterFrontEnd,
  labShell: ILabShell,
  registry: Registry,
  restorer: ILayoutRestorer,
  active: IActiveDataset
): IDataExplorer {
  const displayedURLs = new ObservableSet<string>();
  displayedURLs.add(ACTIVE_URL);
  displayedURLs.add(new URL('file:').toString());

  // Create a dataset with this URL
  const widget = ReactWidget.create(
    <DataExplorer
      registry={registry}
      active={active}
      urls$={displayedURLs.observable}
    />
  );
  widget.id = '@jupyterlab-dataRegistry/explorer';
  widget.title.iconClass = 'jp-SpreadsheetIcon jp-SideBar-tabIcon';
  widget.title.caption = 'Data Explorer';

  restorer.add(widget, widget.id);
  labShell.add(widget, 'left');
  return { widget, addURL: displayedURLs.add, removeURL: displayedURLs.remove };
}
