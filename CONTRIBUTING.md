<!--

@license BSD-3-Clause

Copyright (c) 2019 Project Jupyter Contributors.
Distributed under the terms of the 3-Clause BSD License.

-->

# Contribution Guidelines

> Project contribution guidelines.

## Introduction

First off, thanks for your interest! While this guide focuses on technical development, if you are looking to contribute to the project but are non-technical, you can still contribute! For example, you can contribute by filing issues, writing feature requests, updating documentation, providing build and infrastructure support, and helping market and promote the project, among other things. Every bit helps, and we are grateful for your time and effort!

## Code of Conduct

**Before** contributing, read the [Code of Conduct][jupyter-code-of-conduct], which details the _bare minimum_ behavior expectations that the project requires of its contributors.

## Contributions

### Issues

When filing new issues and commenting on existing issues on this repository, please ensure that discussions are related to concrete technical issues.

**Before** filing a potential bug report,

-   Search for existing issues and pull requests.
-   Try some debugging techniques to help isolate the problem, including logging inputs and outputs.

If the source of the problem is a third party package, file a bug report with the relevant package author, rather than on this repository.

When filing an issue, provide the following, where possible:

-   A description of the issue.
-   Links to any related issues.
-   The full error message, including the stacktrace.
-   The sequence of steps required to reproduce the issue.
-   A minimal working example; i.e., the smallest chunk of code that triggers the error. If the code is larger than `50` lines, consider creating a [gist][github-gist].
-   The expected results.
-   List of affected environments; e.g., browser, browser version, `npm` version, Node.js version, operating system, and the project version.

When pasting code blocks or output, use triple backticks to enable proper formatting. Surround inline code with single backticks. For other Markdown formatting tips and trips, see GitHub's [Markdown guide][github-markdown-guide].

Be aware that the `@` symbol tags users on GitHub, so **always** surround package names with backticks (e.g., `@jupyterlab/dataregistry-extension`).

### Code

> By contributing code to the project, you are agreeing to release it under the project [license][license].

**Before** contributing code, be sure to

-   read and understand the [licensing terms][license].

For instructions on how to setup and configure your environment, be sure to

-   read and follow the [development guide][development-guide].

If you want to contribute a new feature or a breaking change to this project, be sure to

-   file an issue detailing the proposed change.
-   wait for feature request approval.
-   adhere to the guidance set forth in the feature request comments.

If you are unfamiliar with [Git][git], the version control system used by GitHub and this project,

-   see the [Git][git] docs.
-   try a tutorial, such as the [tutorial][github-git-tutorial] provided by GitHub.

Next, take a look around the project, noting the style and organization of documentation, tests, examples, and source implementations. Consistency is highly **prioritized** within this project. Thus, the more you are able to match and adhere to project conventions and style, the more likely your contribution will be accepted. While we have done our best to automate linting and style guidelines, such automation is not perfect and cannot adequately capture the inevitable exceptions and nuance to many rules. In short, the more you study existing practice, the better prepared you will be to contribute to this project.

#### Step 0: GitHub

Create a [GitHub account][github-signup]. The project uses GitHub exclusively for hosting source code, managing issues and pull requests, triggering continuous integration, and reporting.

#### Step 1: Fork

[Fork][github-fork] the repository on GitHub and clone the repository to your local machine.

```bash
$ git clone https://github.com/<username>/juptyerlab-data-explorer.git
```

where `<username>` is your GitHub username. The repository may have a large commit history, leading to slow download times. If you are not interested in code archeology, you can reduce the download time by limiting the clone [depth][git-clone-depth].

```bash
$ git clone --depth=<depth> https://github.com/<username>/juptyerlab-data-explorer.git
```

where `<depth>` refers to the number of commits you want to download (as few as `1` and as many as the entire project history).

If you are behind a firewall, you may need to use the `https` protocol, rather than the `git` protocol.

```bash
$ git config --global url."https://".insteadOf git://
```

Once you have finished cloning the repository into the destination directory, you should see the folder `jupyterlab-data-explorer`. To proceed with configuring your environment, navigate to the project folder.

```bash
$ cd jupyterlab-data-explorer
```

And finally, add an `upstream` [remote][git-remotes] to allow syncing changes between this repository and your local version.

```bash
$ git remote add upstream git://github.com/jupyterlab/jupyterlab-data-explorer.git
```

#### Step 2: Branch

For modifications intended to be included in this repository, create a new local branch.

```bash
$ git checkout -b <branch>
```

where `<branch>` is the branch name. The `master` branch for this repository is protected, and direct modifications to this branch will **not** be accepted. Instead, all contributions should be made on non-master local branches, including documentation changes and other non-code modifications.

#### Step 3: Write

Start making your changes and/or implementing the new feature.

#### Step 4: Commit

Ensure that you have configured [Git][git] to know your name and email address.

```bash
$ git config --global user.name "Jane Doe"
$ git config --global user.email "jane.doe@example.com"
```

Add changed files and commit.

```bash
$ git add files/which/changed
$ git commit
```

#### Step 5: Sync

To incorporate recent changes from the `upstream` repository during development, you should [rebase][git-rebase] your local branch, reapplying your local commits on top of the current upstream `HEAD`. This procedure is in contrast to performing a standard [merge][git-merge], which may interleave development histories. The rationale is twofold:

1.  interleaved histories make [squashing][git-rewriting-history] commits more difficult
2.  a standard merge increases the risk of incomplete/broken commits appearing in the Git history.

An ideal commit history is one in which, at no point in time, is the project in a broken state. While not always possible (mistakes happen), striving for this ideal facilitates time travel and software archeology.

```bash
$ git fetch upstream
$ git rebase upstream/develop
```

#### Step 6: Test

Tests should accompany **all** bug fixes and features. For guidance on how to write tests, consult existing tests within the project.

**Before** submitting a [pull request][github-pull-request] to the `upstream` repository, ensure that all tests pass, including linting.

Any [pull requests][github-pull-request] which include failing tests and/or lint errors will **not** be accepted.

To run tests:

```bash
$ jlpm run test
```

When debugging failing tests, to run UI tests in a non-headless browser window:

```bash
$ jlpm run test:debug
```

During UI testing, when a test fails, a screenshot is taken of the current browser state and saved in a local `screenshots` folder to assist in debugging.

If tests fail during continuous integration, a folder containing screenshots can be downloaded as an archive from the Actions panel on GitHub.

#### Step 7: Push

Push your changes to your remote GitHub repository.

```bash
$ git push origin <branch>
```

where `<branch>` is the name of your branch.

#### Step 8: Pull Request

Once your contribution is ready to be incorporated in the `upstream` repository, open a [pull request][github-pull-request] against the `master` branch. A project contributor will review the contribution, provide feedback, and potentially request changes.

> Receiving feedback is the most **important**, and often the most **valuable**, part of the submission process. Don't get disheartened!

To make changes to your [pull request][github-pull-request], make changes to your branch. Each time you push changes to your forked repository, GitHub will automatically update the [pull request][github-pull-request].

```bash
$ git add files/which/changed
$ git commit
$ git push origin <branch>
```

Note that, once a [pull request][github-pull-request] has been made (i.e., your local repository commits have been pushed to a remote server), you should **not** perform any further [rewriting][git-rewriting-history] of Git history. If the history needs modification, a contributor will modify the history during the merge process. The rationale for **not** rewriting public history is that doing so invalidates the commit history for anyone else who has pulled your changes, thus imposing additional burdens on collaborators to ensure that their local versions match the modified history.

#### Step 9: Land

After any changes have been resolved, a contributor will approve a [pull request][github-pull-request] for inclusion in the project. Once merged, the [pull request][github-pull-request] will be updated with the merge commit, and the [pull request][github-pull-request] will be closed.

Note that, during the merge process, multiple commits will often be [squashed][git-rewriting-history].

#### Step 10: Celebrate

**Congratulations**! You are an official contributor to this project! Thank you for your hard work and patience!

## Notes

### GitHub

-   When linking to specific lines of code in an issue or a pull request, hit the `y` key while viewing a file on GitHub. Doing so reloads the page with a URL that includes the specific version of the file you are viewing. This ensures that, when you refer to specific lines, these same lines can be easily viewed in the future, even if the content of the file changes.
-   GitHub does not send notifications when you push a commit and update a [pull request][github-pull-request], so be sure to comment on the pull request thread to inform reviewers that you have made changes.

### Writing Tests

> By contributing tests to the project, you are agreeing to release them under the project [license][license].

### Writing Documentation

> By contributing documentation to the project, you are agreeing to release it under the project [license][license].

Project documentation is localized within each package. Similar to code, you should modify documentation using [Git][git].

## Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

-   (a) The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the file; or
-   (b) The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license), as indicated in the file; or
-   (c) The contribution was provided directly to me by some other person who certified (a), (b) or (c) and I have not modified it.
-   (d) I understand and agree that this project and the contribution are public and that a record of the contribution (including all personal information I submit with it, including my sign-off) is maintained indefinitely and may be redistributed consistent with this project or the open source license(s) involved.

## Conclusion

Phew. While the above may be a lot to remember, even for what seem like minor changes, eventually it becomes routine and part of the normal development flow. Part of the motivation for enforcing process is to ensure that all code contributions meet a certain quality threshold, thus helping reviewers focus less on non-substantive issues like style and failing tests and more on substantive issues such as contribution content and merit. Know that your patience, hard work, time, and effort are greatly appreciated!

<!-- links -->

[jupyter-of-conduct]: https://jupyter.org/conduct/
[license]: https://github.com/jupyter/jupyterlab-data-explorer/blob/master/LICENSE
[development-guide]: https://github.com/jupyter/jupyterlab-data-explorer/blob/master/docs/development.md
[github-signup]: https://github.com/signup/free
[github-pull-request]: https://help.github.com/articles/creating-a-pull-request/
[github-gist]: https://gist.github.com/
[github-markdown-guide]: https://guides.github.com/features/mastering-markdown/
[github-fork]: https://help.github.com/articles/fork-a-repo/
[github-git-tutorial]: http://try.github.io/levels/1/challenges/1
[git]: http://git-scm.com/
[git-clone-depth]: https://git-scm.com/docs/git-clone#git-clone---depthltdepthgt
[git-remotes]: https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes
[git-rebase]: https://git-scm.com/docs/git-rebase
[git-merge]: https://git-scm.com/docs/git-merge
[git-rewriting-history]: https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History

<!-- /.links -->
