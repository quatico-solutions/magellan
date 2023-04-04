<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
# Development process

## Creating a new release

1. Create a release branch `release/0.3.1` and push the branch to the origin
2. Update the java packages using `mvn -DgenerateBackupPoms=false versions:set -DnewVersion=0.3.1`
3. Update the root package json using `yarn version --no-git-tag-version --no-commit-hooks --new-version 0.3.1`
4. Commit the changed pom.xml and package.json files in an `E Update versions` commit.
5. Update `Release-Notes.md` with the version you are about to create a commit `d Update release notes`
6. [Create a draft pull request](https://github.com/quatico-solutions/magellan/pulls) for the release branch and wait for its build to pass.
7. Update the package versions using `npm run prepare-release` and choose version `0.3.1`
8. Wait for the Github Action [Create release and publish](https://github.com/quatico-solutions/magellan/actions/workflows/release-and-publish.yml) to finish.
9. Prepare Java for the next release: `mvn -DgenerateBackupPoms=false versions:set -DnewVersion=0.3.2-SNAPSHOT && mvn verify` and commit as `E Start next release`
10. Merge the release back into develop.

## FAQ

### 1. Problems updating the maven version

Using `mvn -U -B verify`, you can identify a large variety of possible problems.
