# JupyterLab Data Explorer

[![Stability Experimental](https://img.shields.io/badge/stability-experimental-red.svg)](https://img.shields.io/badge/stability-experimental-red.svg)

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-data-explorer/master)

We are currently building a data registry for JupyterLab [#5548](https://github.com/jupyterlab/jupyterlab/issues/5548). The idea is to show users datasets that have been registered and allow users to view those datasets, by relying on a series of data converters.

## TODO

- [ ] Get everything building and working
- [x] Add support for nested datasets in viewer
- [ ] Add open window tracker nested datasets
  - [ ] Add to viewer
  - [ ] Register open windows with this
- [x] Add viewer nested datasets
  - [x] Add a way to register a URL with the viewer
  - [ ] Register base filesystem
- [ ] Add support for folder subfiles
- [ ] Add support for all Notebook outputs
  - [ ] Try this with nteract data viewer

### Later

- [ ] Add support for registered notebook outputs (provide a special URL mimetype)
- [ ] Fix observable -> component workflow... Support react components that takes observable.

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
