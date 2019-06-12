# JupyterLab Data Explorer

[![Stability Experimental](https://img.shields.io/badge/stability-experimental-red.svg)](https://img.shields.io/badge/stability-experimental-red.svg) [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-data-explorer/master)

## Project Vision

We have articulated our vision for this project as a ["Press Release from the Future"](./press_release.md). We are now pursing that vision to make it a _reality_. Have feedback or want to get involved? [Let us know!](https://discourse.jupyter.org/c/jupyterlab)

* Bring any data type you can imagine! **Extensible** and **type safe** data registry system.
* Register **conversions** between the different data types.
* Data changing on you? Use [`RxJS` **observables**](https://rxjs.dev/) to represent data over time.
* Have a new way to look at your data? Create **React** or **Phosphor** components to view a certain type
* Built in data **explorer UI** to find and use available datasets.
* Dataset in your dataset? Use the **nested** datatype.
* Building another data centric application? Use the **`dataregistry`** package which has no JupyterLab dependencies.

![](https://user-images.githubusercontent.com/1186124/59360085-85becf80-8cfd-11e9-8fc8-98d8a7b83934.png)

## Usage

*Not released yet*


## Extending

*Docs to come. For now take a look at the code or open an issue.*


## Contributing

This repo is in active development and we welcome any collaboration. If you have ideas or questions, feel free to open an issue. From there, we could setup a call to chat more in depth about how to work together. Please don't hesitate to reach out.

Or, feel free to tackle an existing issue or contribute a PR that you think improves things. We try to keep the current issues relevent and matched to relevent milestones, to give a sense on where this is going.

If the community grows around this we can adopt a more regular public meeting.

## Development

This relies on features in an unreleased version of JupyterLab, so you you have to run it linked against that version of JupyterLab.

The easiest way to do this is to install [`repo2docker`](https://repo2docker.readthedocs.io/en/latest/usage.html) and Docker
and build it locally:

```bash
python3 -m pip install jupyter-repo2docker

jupyter-repo2docker \
    -v "$PWD/dataregistry-core/src:/home/$USER/jupyterlab/packages/dataregistry-core/src" \
    -v "$PWD/dataregistry-extension/src:/home/$USER/jupyterlab/packages/dataregistry-extension/src" \
    -v "$PWD/dataregistry/src:/home/$USER/jupyterlab/packages/dataregistry/src" \
    -v "$PWD/dataregistry/notebooks:/home/$USER/notebooks" \
    --publish 8888:8888 \
    . _ _ --watch
```

As you update the TypeScript source, it should rebuild so that when you reload you see the changes.

You can also build it locally so that you can get proper type hints in your editor:

```bash
cd jupyterlab
yarn
yarn run build:src
cd ..

yarn
yarn run build:watch
```

We depend on the JupyterLab core using [git subtree](https://manpages.debian.org/testing/git-man/git-subtree.1.en.html) so that TypeScript can read the sources to see the most recent type definitions.

This is instead of adding this as a package inside JupyterLab, which is a bit messy. This is done for you transparently in the `binder/postBuild` file.

### Upgrading JupyterLab

```bash
git subtree pull --prefix jupyterlab git@github.com:jupyterlab/jupyterlab.git master --squash
```
