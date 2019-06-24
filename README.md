# JupyterLab Data Explorer

[![Stability Experimental](https://img.shields.io/badge/stability-experimental-red.svg)](https://img.shields.io/badge/stability-experimental-red.svg) [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-data-explorer/master)

* Bring any data type you can imagine! **Extensible** and **type safe** data registry system.
* Register **conversions** between the different data types.
* Data changing on you? Use [`RxJS` **observables**](https://rxjs.dev/) to represent data over time.
* Have a new way to look at your data? Create **React** or **Phosphor** components to view a certain type
* Built in data **explorer UI** to find and use available datasets.
* Dataset in your dataset? Use the **nested** datatype.
* Building another data centric application? Use the **`dataregistry`** package which has no JupyterLab dependencies.

![](https://user-images.githubusercontent.com/1186124/59360085-85becf80-8cfd-11e9-8fc8-98d8a7b83934.png)

## Project Vision

We have articulated our vision for this project as a ["Press Release from the Future"](./press_release.md). We are now pursing that vision to make it a _reality_. Have feedback or want to get involved? [Post an issue!](https://github.com/jupyterlab/jupyterlab-data-explorer/issues/new)

## Usage

*Not released yet*


## Extending

*Docs to come. For now take a look at the code or open an issue.*


## Contributing

This repo is in active development and we welcome any collaboration. If you have ideas or questions, feel free to open an issue. From there, we could setup a call to chat more in depth about how to work together. Please don't hesitate to reach out.

Or, feel free to tackle an existing issue or contribute a PR that you think improves things. We try to keep the current issues relevent and matched to relevent milestones, to give a sense on where this is going.

If the community grows around this we can adopt a more regular public meeting.

## Development

```bash
conda create -n jupyterlab-data-explorer -c conda-forge python=3.6
conda activate jupyterlab-data-explorer

pip install --pre jupyterlab
yarn
yarn run build


jupyter labextension link ./dataregistry --no-build
jupyter labextension link ./dataregistry-extension

jupyter lab
```
