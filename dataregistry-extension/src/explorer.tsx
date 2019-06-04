/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer
} from "@jupyterlab/application";
import {
  createDataExplorer,
  IDataExplorer,
  IDataRegistry,
  IActiveDataset
} from "@jupyterlab/dataregistry";

/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { Classes } from "@blueprintjs/core";
import { ReactWidget } from "@jupyterlab/apputils";
import {
  Dataset,
  Datasets,
  Datasets$,
  URL_
} from "@jupyterlab/dataregistry-core";
import { Token } from "@phosphor/coreutils";
import { Widget } from "@phosphor/widgets";
import * as React from "react";
import { classes, style } from "typestyle";
import { IActiveDataset } from "./active";
import { IDataRegistry } from "./registry";
import { UseObservable } from "./utils";
import { viewerDataType } from "./viewers";

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
    <button className={buttonClassName} onClick={onClick}>
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

function DatasetCompononent({
  url,
  active$,
  dataset
}: {
  url: URL_;
  dataset: Dataset;
  active$: IActiveDataset;
}) {
  const viewers = viewerDataType.filterDataset(dataset);
  // Sort viewers by label
  viewers.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return (
    <UseObservable observable={active$} initial={null}>
      {active => {
        const classNames = [datasetClassName];
        if (active === url) {
          classNames.push(activeDatasetClassName);
        }
        return (
          <div
            className={classes(...classNames)}
            onClick={() => active$.next(url)}
          >
            <h3
              style={{
                fontSize: 12,
                fontWeight: "unset",
                margin: "unset",
                overflow: "hidden",
                textOverflow: "ellipsis",
                direction: "rtl",
                textAlign: "left"
              }}
            >
              {url.toString()}
            </h3>
            <span>
              {viewers.map(([label, view$]) => (
                <UseObservable observable={view$} initial={() => {}}>
                  {view => (
                    <Button key={label} onClick={() => view()} text={label} />
                  )}
                </UseObservable>
              ))}
            </span>
          </div>
        );
      }}
    </UseObservable>
  );
}

function DatasetsComponent({
  active,
  datasets$
}: {
  active: IActiveDataset;
  datasets$: Datasets$;
}) {
  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <UseObservable observable={datasets$} initial={new Map() as Datasets}>
        {datasets =>
          [...datasets].map(([url, dataset]) => (
            <DatasetCompononent
              key={url}
              url={url}
              dataset={dataset}
              active$={active}
            />
          ))
        }
      </UseObservable>
    </div>
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
      <input
        type="text"
        placeholder="Search..."
        style={{ marginLeft: 12 }}
        className={classes(Classes.INPUT, Classes.SMALL)}
        value={search}
        onChange={event => onSearch(event.target.value)}
      />
    </h2>
  );
}

class DataExplorer extends React.Component<
  {
    dataRegistry: IDataRegistry;
    active: IActiveDataset;
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
        <DatasetsComponent
          datasets$={this.props.dataRegistry.datasets$}
          active={this.props.active}
        />
      </div>
    );
  }
}

export function createDataExplorer(
  dataRegistry: IDataRegistry,
  active: IActiveDataset
): IDataExplorer {
  const widget = ReactWidget.create((
    <DataExplorer dataRegistry={dataRegistry} active={active} />
  ) as any);
  widget.id = "@jupyterlab-dataRegistry/explorer";
  widget.title.iconClass = "jp-SpreadsheetIcon  jp-SideBar-tabIcon";
  widget.title.caption = "Data Explorer";
  return widget;
}
/* tslint:disable */
export const IDataExplorer = new Token<IDataExplorer>(
  "@jupyterlab/dataRegistry:IDataExplorer"
);

export interface IDataExplorer extends Widget {}

const id = "@jupyterlab/dataregistry-extension:data-explorer";
/**
 * Adds a visual data explorer to the sidebar.
 */
export default {
  activate,
  id,
  requires: [ILabShell, IDataRegistry, ILayoutRestorer, IActiveDataset],
  provides: IDataExplorer,
  autoStart: true
} as JupyterFrontEndPlugin<IDataExplorer>;

function activate(
  app: JupyterFrontEnd,
  labShell: ILabShell,
  dataRegistry: IDataRegistry,
  restorer: ILayoutRestorer,
  active: IActiveDataset
): IDataExplorer {
  const widget = createDataExplorer();
  restorer.add(widget, widget.id);
  labShell.add(widget, "left");
  return widget;
}
