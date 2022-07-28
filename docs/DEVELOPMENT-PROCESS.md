# Development process

## Creating a new release

1. Create a release branch `release/v0.1.0` for example and push the branch to the origin
2. Update the java packages using `mvn -DnewVersion=0.1.0 -DgenerateBackupPoms=false versions:set`
3. Update the package versions using `npm run prepare-release` and choose version `0.1.0`
