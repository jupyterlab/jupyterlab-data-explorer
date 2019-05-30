import { Token } from "@phosphor/coreutils";
import { URL_ } from "@jupyterlab/dataregistry-core";
import { BehaviorSubject } from "rxjs";

export interface IActiveDataset extends BehaviorSubject<URL_ | null> {}
export const IActiveDataset = new Token<IActiveDataset>(
  "@jupyterlab/dataregistry:IActiveDataset"
);
