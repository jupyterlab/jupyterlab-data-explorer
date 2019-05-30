import { Token } from "@phosphor/coreutils";
import { Registry } from "@jupyterlab/dataregistry-core";

export interface IDataRegistry extends Registry {}
export const IDataRegistry = new Token<IDataRegistry>(
  "@jupyterlab/dataregistry:IDataRegistry"
);
