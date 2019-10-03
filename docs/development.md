<!-- 

@license BSD-3-Clause

Copyright (c) 2019 Project Jupyter Contributors.
Distributed under the terms of the 3-Clause BSD License.

-->

# Development

> Development guide.

## Introduction

Before we begin, development requires some setup and configuration. What follows is an overview of environment requirements and a sequence of steps for getting up and running. We use [Git][git] for version control, and for most tasks, we use [npm][npm] scripts to help us get things done quickly and effectively. For the most part, the project is able to internally manage dependencies for testing and linting, so, once you follow the steps below, you should be ready to start developing!

So, without further ado, let's get you started!

## Prerequisites

Development requires the following prerequisites:

-   [Git][git]: version control
-   [Python][python]: general purpose language (version `>= 3.6`)
-   [pip][pip]: Python package manager (version `>= 9.0.0`)
-   [Node.js][node-js]: JavaScript runtime (latest stable version is **strongly** recommended)
-   [npm][npm]: package manager (version `> 2.7.0`)
-   [JupyterLab][jupyterlab]: computational environment (version `>= 1.0.0`)

While not required, you are encouraged to create an [Anaconda][anaconda] environment.

```bash
$ conda create -n jupyterlab-data-explorer -c conda-forge python=3.6 -c anaconda jupyterlab nodejs
```

To activate the environment,

```bash
$ conda activate jupyterlab-data-explorer
```

> **NOTE**: for each new terminal window, you'll need to explicitly activate the [Anaconda][anaconda] environment.

## Download

To acquire the source code, first navigate to the parent directory in which you want to place the project [Git][git] repository.

> **NOTE**: avoid directory paths which include spaces or any other shell meta characters such as `$` or `:`, as these characters can be problematic for certain build tools.

```bash
$ cd /path/to/parent/destination/directory
```

Next, clone the repository.

```bash
$ git clone https://github.com/jupyterlab/jupyterlab-data-explorer.git
```

If you are wanting to contribute to this GitHub repository, first [fork][github-fork] the repository and amend the previous command.

```bash
$ git clone https://github.com/<username>/jupyterlab-data-explorer.git
```

where `<username>` is your GitHub username (assuming you are using GitHub to manage public repositories). The repository may have a large commit history, leading to slow download times. If you are not interested in code archeology, you can reduce the download time by limiting the [depth][git-clone-depth].

```bash
$ git clone --depth=<depth> https://github.com/<username>/jupyterlab-data-explorer.git
```

where `<depth>` refers to the number of commits you want to download (as few as 1 and as many as the entire project history).

If you are behind a firewall, you may need to use the HTTPS protocol, rather than the [Git][git] protocol.

```bash
$ git config --global url."https://".insteadOf git://
```

Once you have finished cloning the repository into the destination directory, you should see the folder `jupyterlab-data-explorer`. To proceed with configuring your environment, navigate to the project folder.

```bash
$ cd jupyterlab-data-explorer
```

## Installation

To install development dependencies (e.g., [Node.js][node-js] module dependencies),

```bash
$ jlpm install
```

where `jlpm` is the JupyterLab package manager which is bundled with [JupyterLab][jupyterlab].

During development, we need to maintain a local [npm][npm] package registry for storing unpublished data explorer packages. In a separate terminal window,

```bash
$ jlpm run registry
```

Returning to the previous terminal window, initialize the local package registry

```bash
$ jlpm run registry:init
```

When prompted for user credentials, simply enter `foo` for the username, `bar` for the password, and `foo@bar.com` for the e-mail address. These values are not checked and can be anything.

To verify that the local package registry is running and that local packages have been published to that registry,

```bash
$ open http://localhost:4873
```

## Build

To build data explorer packages,

```bash
$ jlpm run build
```

If your environment has been configured correctly, the previous command should complete without errors.

To build the [JupyterLab][jupyterlab] extensions found in this repository and to launch the [JupyterLab][jupyterlab] environment,

```bash
$ jlpm run build:jupyter
```

## Clean

To clean your local environment, including [Node.js][node-js] module dependencies,

```bash
$ jlpm run clean
```

To remove build artifacts, such as compiled JavaScript files, from data explorer packages,

```bash
$ jlpm run clean:packages
```

To remove [JupyterLab][jupyterlab] extension artifacts, such as linked extensions,

```bash
$ jlpm run clean:jupyter
```

## Reset

To clean and rebuild the data explorer extensions,

```bash
$ jlpm run all
```

## Watch

During development, you'll likely want data explorer extensions to automatically recompile and update. Accordingly, in a separate terminal window,

```bash
$ jlpm run build:watch
```

which will automatically trigger recompilation upon updates to source files.

In another terminal window,

```bash
$ jlpm run build:jupyter:watch
```

which will launch the [JupyterLab][jupyterlab] environment and automatically update the running lab environment upon recompilation changes.

## Update

If you have previously downloaded the repository using `git clone`, you can update an existing source tree from the base project directory using `git pull`.

```bash
$ git pull
```

If you are working with a [forked][github-fork] repository and wish to [sync][github-fork-sync] your local repository with the [upstream][git-remotes] project (i.e., incorporate changes from the main project repository into your local repository), assuming you have [configured a remote][github-remote] which points to the upstream repository,

```bash
$ git fetch upstream
$ git merge upstream/<branch>
```

where `upstream` is the remote name and `<branch>` refers to the branch you want to merge into your local copy.

## Organization

The repository is organized as follows:

```text
binder     Binder configuration
docs       top-level documentation
notebooks  Jupyter notebooks
packages   project packages
```

## Core concepts

The data registry is a global collection of datasets. Each dataset is conceptually a tuple of `(URL, MimeType, cost, data)`; however, we store them in nested maps of `Map<URL, Map<MimeType, [cost, data]>>` so that, for every unique pair of URL and MimeType, we only have one dataset ([`./dataregistry/src/datasets.ts`](./../packages/dataregistry/src/datasets.ts)).

A "converter" takes in a dataset and returns several other datasets that all have the same URL. We can apply a converter to a certain URL by viewing it as a graph exploration problem. There is one node per Mime Type and we can [fill in the graph][dijkstras-algorithm] to add every reachable mime type with the lowest cost ([`./dataregistry/src/converters.ts`](./../packages/dataregistry/src/converters.ts)). 

Conceptually, each Mime Type should correspond to some defined runtime type of data. For example `text/csv` corresponds to an `Observable<string>` which is the contents of CSV file. We need to be able to agree about these definitions so that, if create a converter to produce a `text/csv` mime type and you create one that takes in that mime type and creates some visualization, we know we are dealing with the same type. A "data type" helps us here because we map a set of mime types to a TypeScript type. For example, we could define the CSV mime type as `new DataTypeNoArgs<Observable<string>>("text/csv")`. We provide a way to create a converter from one data type to another, which is `createConverter`. Data types abstract away the textual representation of the mime type from the consumer of a data type and provide a type safe way to convert to or from that data type. All of our core conversions use this typed API ([`./dataregistry/src/datatypes.ts`](./../packages/dataregistry/src/datatypes.ts)):

-  [`resolveDataType`](./../packages/dataregistry/src/resolvers.ts) `void`: Every URL starts with this data type when you ask for it. It has no actual data in it, so when you write a converter from it you will use the URL.
-  [`nestedDataType`](./../packages/dataregistry/src/nested.ts) `Observable<Set<URL_>>`: This specifies the URLs that are "nested" under a URL. Use this if your dataset has some sense of children like a folder has a number of files in it or a database has a number of tables. These are exposed in the data explorer as the children in the hierarchy.
-  [`viewerDataType`](./../packages/dataregistry-extension/src/viewers.ts) `() => void`: This is a function you can call to "view" that dataset in some way. It has a parameter as well, the "label", which is included in the mime type as an argument. This is exposed in the explorer as a button on the dataset.

<!-- 

So conceptually, we can see a number of datasets as a number of graphs, one for each URL. Adding a new converter can expand the possible Mime Types for each URL. In the registry we can either register a new converter, get all the mime types for an existing URL, or retrieve the list of current URLs that are registered ([`./dataregistry/src/registry.ts`])(./../packages/dataregistry/src/registry.ts)). 

When we first ask for a URL, we have to create some initial mime type to describe that URL. We made up the `application/x.jupyter.resolve` mime type for this. All datasets start with the mime type, so to derive some other mime type you have to start from this one ([`./dataregistry/src/resolve.ts`])(./../packages/dataregistry/src/resolve.ts)).

-->

## Editors

-   This repository uses [EditorConfig][editorconfig] to maintain consistent coding styles between different editors and IDEs, including [browsers][editorconfig-chrome].

<!-- links -->

[git]: http://git-scm.com/

[python]: https://www.python.org/

[pip]: https://github.com/pypa/pip

[node-js]: https://nodejs.org/en/

[npm]: https://www.npmjs.com/

[jupyterlab]: https://github.com/jupyterlab/jupyterlab

[anaconda]: https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html

[github-fork]: https://help.github.com/articles/fork-a-repo/

[github-fork-sync]: https://help.github.com/articles/syncing-a-fork/

[github-remote]: https://help.github.com/articles/configuring-a-remote-for-a-fork/

[git-clone-depth]: https://git-scm.com/docs/git-clone#git-clone---depthltdepthgt

[git-remotes]: https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes

[dijkstras-algorithm]: https://en.wikipedia.org/wiki/Dijkstra's_algorithm

[editorconfig]: http://editorconfig.org/

[editorconfig-chrome]: https://chrome.google.com/webstore/detail/github-editorconfig/bppnolhdpdfmmpeefopdbpmabdpoefjh?hl=en-US

<!-- /.links -->
