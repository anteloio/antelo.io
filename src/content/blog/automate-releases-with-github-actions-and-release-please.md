---
title: "Automate Releases with GitHub Actions and release-please"
description: "Set up automated versioning and changelogs with release-please and GitHub Actions, driven entirely by your conventional commits."
publishedAt: 2025-03-30
---

You basically need three files:

- a config file, to set up release-please options for each component
- a manifest file, to specify the current version of existing components
- a workflow file, to automate the release process for your repository

If your current repo has, for instance, a npm package under a subfolder named cherry-cli. You'd need a basic config file to declare this component with its options:

```json
// release-please-config.json
{
  "separate-pull-requests": true,
  "packages": {
    ".": {
      "release-type": "python"
    },
    "packages/cherry-cli": {
      "release-type": "node"
    }
  },
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json"
}
```

If your package has already been published, declare its current version with:

```json
// .release-please-manifest.json
{
  ".": "2.0.11",
  "packages/cherry-cli": "1.0.9"
}
```

Finally, you'll need to automate the release process via GitHub Actions.

For that, you need to create a workflow file like below:

```yaml
name: release-please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
```

Commit and push it all to your main branch.

From now on, release-please will run against every commit that is merged into your main branch. It will look for conventional commits such as `feat`, and decide whether it should publish a new minor, major, or patch version of your component.

It will also use the rest of the commit message to update your CHANGELOG.md.

## How can I test before merging?

If you're making all the above changes inside the same pull request, and you want to try it out before merging, then you can change the target-branch to point to your current branch. For it to run on pull requests:

```yaml
name: release-please

on:
  push:
    branches:
      - main

# For testing purposes, we'll force release-please to run
# on pull requests, so we can see the results of the action
# before merging it into the main branch.
  pull_request:

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          # The line below will force release-please to
          # run on the current branch and, thus, be able to
          # rely on the manifest file that we've just defined.
          target-branch: <current-branch>
```

## Conventional Commits

Conventional commits are a way to indicate to release-please what kind of changes you made. It'll then rely on the commit message to automate the bump of the version of your components, and to generate their changelogs.

Here's what a conventional commit message looks like:

```text
<type>(<scope>): <description>
```

**type**: This tells you what kind of change it is. Some of the most common types include:

- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (like formatting)
- refactor: Code changes that aren't new features or bug fixes
- test: Adding or updating tests
- chore: Changes to the build process or tools

**scope**: This is optional and tells you which part of the codebase is affected, and depends on your own project's nature (like web or api).

**description**: A brief summary of the change.

For instance:

```bash
git commit -m "feat(web): allow users to delete their accounts"
git commit -m "fix(api): handle null values in response"
```

## Are there any other types?

Yes, additional types include perf, build, ci, revert, merge, wip. You can find details about all of them on [conventionalcommits.org](https://www.conventionalcommits.org).

## How does release-please decide which version to bump?

Release-please follows the Conventional Commits specification to determine whether to trigger a **patch**, **minor**, or **major** version bump based on commit messages.

Here's how it maps:

**Patch version (x.y.Z):** fix, perf

**Minor version (x.Y.z):** feat, refactor, style, test, chore

**Major version (X.y.z):**

- Commit includes BREAKING CHANGE in the body
- Commit includes a bang (!) in the type or scope, e.g. feat!: or feat(api)!:

Release-please reads your commits, figures out the right bump, and updates your changelog automatically.

The setup is ten minutes. The discipline is writing conventional commits consistently. If your team does that, versioning runs itself. If it doesn't, you'll be curating changelogs by hand anyway.
