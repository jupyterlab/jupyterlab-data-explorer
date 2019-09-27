/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer
} from "@jupyterlab/application";

import { ReactWidget } from "@jupyterlab/apputils";

import { Token } from "@phosphor/coreutils";
import { Widget } from "@phosphor/widgets";
import * as React from "react";
import { classes, style } from "typestyle";
import { IRegistry } from "@jupyterlab/dataregistry-registry";
import { IActiveDataset, ACTIVE_URL } from "./active";
import { UseObservable } from "./utils";
import { viewerDataType } from "./viewers";
import {
  Registry,
  URL_,
  ObservableSet,
  nestedDataType,
  DataTypeNoArgs
} from "@jupyterlab/dataregistry";
import { Observable, of } from "rxjs";

export const labelDataType = new DataTypeNoArgs<Observable<string>>(
  "application/x.jupyterlab.label"
);

const buttonClassName = style({
  color: "#2196F3",
  borderRadius: 2,
  background: "#FFFFFF",
  fontSize: 10,
  borderWidth: 0,
  marginRight: 12, // 2 + 10 spacer between
  padding: "2px 4px",
  $nest: {
    "&:active": {
      background: "#BDBDBD"
    },
    "&:active:hover": {
      background: "#BDBDBD"
    },
    "&:hover": {
      background: "#E0E0E0"
    }
  }
});

function Button({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <button
      className={buttonClassName}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
    >
      {text}
    </button>
  );
}

const datasetClassName = style({
  borderBottom: "1px solid #E0E0E0",
  color: "#333333",
  padding: 4,
  paddingRight: 12,
  paddingLeft: 12,
  borderLeftWidth: 8,
  borderLeftColor: "white",
  borderLeftStyle: "solid",
  $nest: {
    "&:hover": {
      borderLeftColor: "#E0E0E0"
    },
    "&:active": {
      borderLeftColor: "#BDBDBD"
    },
    "&:active:hover": {
      borderLeftColor: "#BDBDBD"
    }
  }
});

const activeDatasetClassName = style({
  borderLeftColor: "var(--jp-brand-color1)",
  $nest: {
    "&:hover": {
      borderLeftColor: "var(--jp-brand-color1)"
    },
    "&:active": {
      borderLeftColor: "var(--jp-brand-color1)"
    },
    "&:active:hover": {
      borderLeftColor: "var(--jp-brand-color1)"
    }
  }
});

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
  parentURL: URL_;
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
        const classNames = [datasetClassName];
        if (active === url) {
          classNames.push(activeDatasetClassName);
        }
        // Use label if it exists
        let label = labelDataType.getDataset(registry.getURL(url));
        // otherwise use url
        if (!label) {
          label = of(
            url.startsWith(parentURL) ? url.slice(parentURL.length) : url
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
            <h3
              style={{
                fontSize: 12,
                fontWeight: "unset",
                margin: "unset",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "left"
              }}
            >
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
                  url={url}
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
  url: URL_;
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
    <h2
      style={{
        paddingTop: 8,
        paddingBottom: 6,
        paddingLeft: 12,
        paddingRight: 12,
        fontSize: 14,
        letterSpacing: "0.1em",
        margin: "unset",
        color: "#333333",
        display: "flex",
        justifyContent: "space-between",
        borderBottom:
          "var(--jp-border-width) solid var(--jp-toolbar-border-color)",
        boxShadow: "var(--jp-toolbar-box-shadow)"
      }}
    >
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
    search: ""
  };

  render() {
    return (
      <div
        style={{
          background: "#FFFFFF",
          color: "#000000",
          fontFamily: "Helvetica",
          height: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Heading
          search={this.state.search}
          onSearch={(search: string) => this.setState({ search })}
        />
        <div style={{ overflow: "auto" }}>
          <DatasetsComponent
            url=""
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
  "@jupyterlab/dataRegistry:IDataExplorer"
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

const id = "@jupyterlab/dataregistry-extension:data-explorer";
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
  displayedURLs.add(new URL("file:").toString());

  // Create a dataset with this URL
  const widget = ReactWidget.create(
    <DataExplorer
      registry={registry}
      active={active}
      urls$={displayedURLs.observable}
    />
  );
  widget.id = "@jupyterlab-dataRegistry/explorer";
  widget.title.iconClass = "jp-SpreadsheetIcon jp-SideBar-tabIcon";
  widget.title.caption = "Data Explorer";

  restorer.add(widget, widget.id);
  labShell.add(widget, "left");
  return { widget, addURL: displayedURLs.add, removeURL: displayedURLs.remove };
}
