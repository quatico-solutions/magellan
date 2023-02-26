<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
# Development process

## Creating a new release

1. Create a release branch `release/0.1.4` and push the branch to the origin
2. Update the java packages using `mvn -DgenerateBackupPoms=false versions:set -DnewVersion=0.1.4`
3. Update the root package json using `yarn version --new-version 0.1.4 --no-git-tag-version --no-commit-hooks`
4. Commit the changed pom.xml and package.json files in an `E Update versions` commit.
5. Update the package versions using `npm run prepare-release` and choose version `0.1.4`
6. Wait for the Github Action [Create release and publish](https://github.com/quatico-solutions/magellan/actions/workflows/release-and-publish.yml) to finish.
7. Merge the release back into develop.
8. Prepare Java for the next release: `mvn -DgenerateBackupPoms=false versions:set -DnewVersion=0.1.5-SNAPSHOT` and commit as `E Start next release`

## FAQ

### 1. Problems updating the maven version

Using `mvn -U -B verify`, you can identify a large variety of possible problems.
