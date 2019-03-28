# JupyterLab Data Explorer

 [![Stability Experimental](https://img.shields.io/badge/stability-experimental-red.svg)](https://img.shields.io/badge/stability-experimental-red.svg)

We are currently building a data registry for JupyterLab [#5548](https://github.com/jupyterlab/jupyterlab/issues/5548). The idea is to show users datasets that have been registered and allow users to view those datasets, by relying on a series of data converters.

## Development

This relies on features on in an unreleased version of JupyterLab. 

We use [`repo2docker`](https://repo2docker.readthedocs.io/en/latest/usage.html) to try it locally:

```bash
python3 -m pip install jupyter-repo2docker

cd jupyterlab
yarn
yarn run build:src
cd ..

yarn
yarn run build:watch

# in another window:
jupyter-repo2docker \
    -v "$PWD/dataregistry-extension/src:/home/$USER/jupyterlab/packages/dataregistry-extension/src" \
    -v "$PWD/dataregistry/src:/home/$USER/jupyterlab/packages/dataregistry/src" \
    . --watch
```

We depend on the JupyterLab core using [git subtree](https://manpages.debian.org/testing/git-man/git-subtree.1.en.html) so that TypeScript can read the sources to see the most recent type definitions.

This is instead of adding this as a package inside JupyterLab, which is a bit messy.
