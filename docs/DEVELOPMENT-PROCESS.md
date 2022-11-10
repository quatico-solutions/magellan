<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
# Development process

## Creating a new release

1. Create a release branch `release/0.1.4` and push the branch to the origin
2. Update the java packages using `mvn -DnewVersion=0.1.4 -DgenerateBackupPoms=false versions:set`
3. Commit the changed pom.xml files in an `E Update versions` commit. 
4. Update the package versions using `npm run prepare-release` and choose version `0.1.4`
5. Wait for the Github Action [Create release and publish](https://github.com/quatico-solutions/magellan/actions/workflows/release-and-publish.yml) to finish.
6. Merge the release back into develop.
7. Prepare Java for the next release: `mvn -DnewVersion=0.1.1-SNAPSHOT -DgenerateBackupPoms=false versions:set` and commit as `E Start next release`