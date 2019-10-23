/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Token } from '@phosphor/coreutils';
import { Registry } from '@jupyterlab/dataregistry';
import activate from './activate';

/**
 * Registry converter interface.
 */
export interface IRegistry extends Registry {}

/**
 * Registry token.
 */
export const IRegistry = new Token<IRegistry>(
  '@jupyterlab/dataregistry:Registry'
);

/**
 * Plugin registration data.
 */
const extension: JupyterFrontEndPlugin<Registry> = {
  id: '@jupyterlab/dataregistry-extension:data-registry',
  activate: activate,
  autoStart: true,
  requires: [],
  provides: IRegistry
};

/**
 * Exports.
 */
export default extension;
