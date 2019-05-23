/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { ReactWidget } from "@jupyterlab/apputils";
import { Token } from "@phosphor/coreutils";
import * as React from "react";
import { Widget } from "@phosphor/widgets";
import { style, classes } from "typestyle";
import { Classes } from "@blueprintjs/core";

// type Data = { [key: string]: Array<string> };

// const addedDB: Data = {
//   "file://": ["load contents"],
//   "postgres://localhost:5432/postgres": ["load tables", "snippet"]
// };

// const addedDBLoaded: Data = {
//   "file://": ["load contents"],
//   "file://notebooks/": ["load contents"],
//   "file://notebooks/Analysis.ipynb#cells/0/outputs/0": ["datagrid", "voyager"],
//   "file://notebooks/Analysis.ipynb#cells/3/outputs/0": ["datagrid", "voyager"],
//   "file://tmp.csv": ["datagrid", "snippet"],
//   "postgres://localhost:5432/postgres": ["load tables", "snippet"],
//   "postgres://localhost:5432/postgres/artists": ["datagrid", "snippet"],
//   "postgres://localhost:5432/postgres/exhibitions": ["datagrid", "snippet"],
//   "postgres://localhost:5432/postgres/press": ["datagrid", "snippet"]
// };

// const reloadWithNotebookOpen: Data = {
//   "file://": ["load contents"],
//   "file://notebooks/Analysis.ipynb#cells/0/outputs/0": ["datagrid", "voyager"],
//   "file://notebooks/Analysis.ipynb#cells/3/outputs/0": ["datagrid", "voyager"],
//   "postgres://localhost:5432/postgres": ["load tables", "snippet"]
// };

type NestedData = { [key: string]: [Array<string>, NestedData] };

// const addedDBNested: NestedData = {
//   "file://": [["load contents"], {}],
//   "postgres://localhost:5432/postgres": [["load tables", "snippet"], {}]
// };

const addedDBLoadedNested: NestedData = {
  "file://": [
    [],
    {
      "tmp.csv": [["datagrid", "snippet"], {}],
      "notebooks/": [
        [],
        {
          "Analysis.ipynb#cells/": [
            [],
            {
              "0/outputs/0": [["datagrid", "voyager"], {}],
              "10/outputs/0": [["datagrid", "voyager"], {}]
            }
          ]
        }
      ]
    }
  ],
  "postgres://localhost:5432/postgres/": [
    [],
    {
      artists: [["datagrid", "snippet"], {}],
      exhibitions: [["datagrid", "snippet"], {}],
      press: [["datagrid", "snippet"], {}]
    }
  ]
};

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

// const datasetClassName = style({
//   borderBottom: "1px solid #E0E0E0",
//   color: "#333333",
//   padding: 4,
//   paddingRight: 12,
//   paddingLeft: 12,
//   borderLeftWidth: 8,
//   borderLeftColor: "white",
//   borderLeftStyle: "solid",
//   $nest: {
//     "&:hover": {
//       borderLeftColor: "#E0E0E0"
//     },
//     "&:active": {
//       borderLeftColor: "#BDBDBD"
//     },
//     "&:active:hover": {
//       borderLeftColor: "#BDBDBD"
//     }
//   }
// });

// const activeDatasetClassName = style({
//   borderLeftColor: "var(--jp-brand-color1)",
//   $nest: {
//     "&:hover": {
//       borderLeftColor: "var(--jp-brand-color1)"
//     },
//     "&:active": {
//       borderLeftColor: "var(--jp-brand-color1)"
//     },
//     "&:active:hover": {
//       borderLeftColor: "var(--jp-brand-color1)"
//     }
//   }
// });

function DatasetCompononent({ data }: { data: NestedData }) {
  return (
    <ul style={{ paddingLeft: 20 }}>
      {Object.keys(data).map(url => (
        <li style={{ listStyleType: "none" }}>
          <span>
            {Object.keys(data[url][1]).length !== 0 ? "▼" : ""}
            {url}
          </span>
          <br />
          <span>
            {data[url][0].map(view => (
              <Button onClick={() => null} text={view} />
            ))}
          </span>
          <DatasetCompononent data={data[url][1]} />
        </li>
      ))}
    </ul>
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

class DataExplorer extends React.Component<{}, { search: string }> {
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
        <div style={{ flex: 1, overflow: "auto" }}>
          <DatasetCompononent data={addedDBLoadedNested} />
        </div>
      </div>
    );
  }
}

export function createDataExplorer(): IDataExplorer {
  const widget = ReactWidget.create(<DataExplorer />);
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
