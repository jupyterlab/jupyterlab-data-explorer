import { DataTypeStringArg } from "@jupyterlab/dataregistry";

/**
 * Subscribe to this observable to view the dataset. The label should be display in the UI for the user.
 */
export const viewerDataType = new DataTypeStringArg<() => void>(
  "application/x.jupyter.viewer",
  "label"
);
