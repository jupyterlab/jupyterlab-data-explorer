/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  IConverterRegistry,
  URL_StringConverter,
  resolverURL_Converter
} from '@jupyterlab/dataregistry';

export default {
  activate,
  id: '@jupyterlab/dataregistry-extension:urls',
  requires: [IConverterRegistry],
  autoStart: true
} as JupyterFrontEndPlugin<void>;

function activate(app: JupyterFrontEnd, converters: IConverterRegistry) {
  converters.register(URL_StringConverter);
  converters.register(resolverURL_Converter);
}
