# JupyterLab Data Explorer

 [![Stability Experimental](https://img.shields.io/badge/stability-experimental-red.svg)](https://img.shields.io/badge/stability-experimental-red.svg)

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-data-explorer/master)

We are currently building a data registry for JupyterLab [#5548](https://github.com/jupyterlab/jupyterlab/issues/5548). The idea is to show users datasets that have been registered and allow users to view those datasets, by relying on a series of data converters.

## Development

This relies on features in an unreleased version of JupyterLab, so you you have to run it linked against that version of JupyterLab.

The easiest way to do this is to install  [`repo2docker`](https://repo2docker.readthedocs.io/en/latest/usage.html) and Docker
and build it locally: 

```bash
python3 -m pip install jupyter-repo2docker

jupyter-repo2docker \
    -v "$PWD/dataregistry-extension/src:/home/$USER/jupyterlab/packages/dataregistry-extension/src" \
    -v "$PWD/dataregistry/src:/home/$USER/jupyterlab/packages/dataregistry/src" \
    . --watch
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

This is instead of adding this as a package inside JupyterLab, which is a bit messy.
