import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { ITranslator } from '@jupyterlab/translation';

const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/dataregistry-extension:plugin',
  autoStart: true,
  requires: [ITranslator, ILayoutRestorer, ILabShell],
  activate: (app, translator, layoutRestorer, shell) => {
    console.log('Activated dataregistry extension...');
  },
};

export default plugin;
