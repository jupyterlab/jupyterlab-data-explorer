import { Token } from '@phosphor/coreutils';
import { ISignal, Signal } from '@phosphor/signaling';

export class ActiveDataset {
  constructor() {
    this._signal = new Signal(this);
  }
  get signal(): ISignal<ActiveDataset, URL_ | null> {
    return this._signal;
  }
  get active(): URL_ | null {
    return this._active;
  }

  set active(newURL_: URL_ | null) {
    console.log('Setting active', newURL_);
    this._active = newURL_;
    this._signal.emit(newURL_);
  }

  private _active: URL_ | null = null;
  private _signal: Signal<ActiveDataset, URL_ | null>;
}

export interface IActiveDataset extends ActiveDataset {}
export const IActiveDataset = new Token<IActiveDataset>(
  '@jupyterlab/dataregistry:IActiveDataset'
);
