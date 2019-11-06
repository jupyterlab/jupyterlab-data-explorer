# JupyterLab Data Explorer

![Stability Experimental][badge-stability] [![Binder][badge-binder]][binder] [![npm][badge-npm-version-dataregistry-extension]][npm-package-dataregistry-extension] [![npm][badge-npm-version-dataregistry]][npm-package-dataregistry]

```bash
jupyter labextension install @jupyterlab/dataregistry-extension
```

-   Bring any data type you can imagine! **Extensible** and **type safe** data registry system.
-   Register **conversions** between the different data types.
-   Data changing on you? Use [`RxJS` **observables**][rxjs] to represent data over time.
-   Have a new way to look at your data? Create **React** or **Phosphor** components to view a certain type.
-   Built in data **explorer UI** to find and use available datasets.
-   Dataset in your dataset? Use the **nested** datatype.
-   Building another data centric application? Use the **`@jupyterlab/dataregistry`** package which has no JupyterLab dependencies.
-   Check out the project vision in the ["Press Release from the Future"](./press_release.md)!

![](https://user-images.githubusercontent.com/1186124/59360085-85becf80-8cfd-11e9-8fc8-98d8a7b83934.png)

## I want to...

### Explore my data in JupyterLab:

1. Install JupyterLab >= 1.0
2. `jupyter labextension install @jupyterlab/dataregistry-extension`
3. Browse available datasets in the data explorer left side pane. We include support for viewing a few datasets. We plan on expanding this list and third party extension can extend it:
    1. Opening CSV files in the data grid and adding a snippet to open them with Pandas
    2. Opening PNG images in an image viewer
    3. Opening table data outputted in a notebook with [`nteract`'s data explorer][nteract-data-explorer]

![](./docs/img/nteract.png)

### Support a new data type or conversion:

You can either add support in this repo or by creating a new JupyterLab extension that depends on the `IRegistry` exposed by this extension. You can access a `Registry`, which you can use to add your own converter.

It might also be useful to view the existing data types by looking at the source code in this repo and by using the debugger. You can open this in JupyterLab by looking for the "Data Debugger" command:

![](./docs/img/debugger.png)

## Contributing

This repository is in active development, and we welcome collaboration. For development guidance, please consult the [development guide](./docs/development.md).

If you have ideas or questions, feel free to open an issue, or, if you feel like getting your hands dirty, feel free to tackle an existing issue by contributing a pull request.

We try to keep the current issues relevant and matched to relevant milestones.

<!-- links -->

[badge-stability]: https://img.shields.io/badge/stability-experimental-red.svg
[badge-binder]: https://mybinder.org/badge_logo.svg
[binder]: https://mybinder.org/v2/gh/jupyterlab/jupyterlab-data-explorer/2bcb40f4422c3eb6bcaad590e27fd2a5e466cc25?urlpath=lab/tree/notebooks/Table.ipynb
[badge-npm-version-dataregistry-extension]: https://img.shields.io/npm/v/@jupyterlab/dataregistry-extension?label=%40jupyterlab%2Fdataregistry-extension&style=flat
[npm-package-dataregistry-extension]: https://www.npmjs.com/package/@jupyterlab/dataregistry-extension
[badge-npm-version-dataregistry]: https://img.shields.io/npm/v/@jupyterlab/dataregistry?label=%40jupyterlab%2Fdataregistry&style=flat
[npm-package-dataregistry]: https://www.npmjs.com/package/@jupyterlab/dataregistry
[rxjs]: https://rxjs.dev/
[nteract-data-explorer]: https://github.com/nteract/nteract/tree/master/packages/data-explorer

<!-- /.links -->
