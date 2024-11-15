<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
<!-- markdownlint-disable MD024 -->

# Releases

Release notes follow the [keep a changelog](https://keepachangelog.com/en/1.1.0/) format.

## [Unreleased]

## [0.11.2] - 2024-11-15

### Added

-   Created a new package `@quatico/magellan-starter` containing templates for different frontend frameworks. The package contains a binary `create-magellan` that guides the user through the process of scaffolding the template in a directory of choice. Currently, the following templates are available:
    -   `react-typescript-webpack`: a simple React application using Typescript and Webpack

## [0.11.0] - 2024-11-15

### Fixed

-   `formdata-fetch`: improved endpoint validation for absolute and relative urls. Invalid URLs now throw an exception.

### Changed

-   **Breaking Change**: The functions `addTransport` and `addTransportIfAbsent` have been removed from the public API. Please use `setTransport` instead. `setTransport` will replace the transport handler if it already exists, or add it if it does not.
-   **Breaking Change**: The functions `addNamespace` and `addNamespaceIfAbsent` have been removed from the public API. Please use `setNamespace` instead. `setNamespace` will replace the namespace mapping if it already exists, or add it if it does not.
-   **Breaking Change**: The function `applyExecutionContext` has been removed from the public API.

## [0.10.0] - 2024-09-20

### Fixed

-   Fixes `resolveNamespace` with custom namespace input returning default namespace and transport if custom namespace could not be resolved. The function now throws an error that the configuration for the custom namespace could not be found.

## [0.8.0] - 2024-06-18

### Added

-   Support for BigInt serialization and deserialization.

## [0.6.2] - 2024-03-25

### Fixed

-   Rejects promise if transport failed (response not ok) in formdata-fetch (server and client). Previously, we attempted to retrieve the response as text even if the response was not ok.

## [0.6.1]

### Changed

-   Upgraded TypeScript dependency to `5.0.x`
-   Upgraded `@quatico/websmith-*` dependencies to `0.4.0`
-   Made the client transformation code more strict. Throws an error during the code generation if the client function accepts a destructured object or a function as parameter.

### Removed

-   Removed `packages/java` focusing the project on nodejs.
-   Removed unused code and dependencies.

## [0.3.0]

### Added

-   Support for `merge: true` in `@quatico/magellan-client/transport/config.js` to merge the configuration with the
    existing configuration of a previous magellan-client frontend instead of replacing it.

### Changed

-   Updates @quatico/magellan-client documentation to current transport configuration.

## [0.2.2] - 2023-02-26

### Changed

-   Exposing additional server api aspects to enable custom express server usage with Magellan
-   Remove maven-frontend-plugin dependency from Serialization maven package.

## [0.2.1] - 2023-02-07

### Added

-   Serialization and deserialization errors during transport-request handling reject the promise.

### Fixed

-   Removes unnecessary dependency to maven-flatten-plugin in serialization package.

## [0.2.1] - 2023-02-07

### Added

-   Support --transpileOnly command line flag for `magellan compile`

### Changed

-   Update to websmith v0.3.5 addressing the undesirable error output.
-   Separate lint and lint:fix: pre-commit hooks now fix linting; CI only validates that the linting rules are followed.

## [0.2.0] - 2022-12-14

### Added

-   service functions throwing errors now yield a rejection of the client promise with the error message.
-   service functions throwing errors now yield a console.error with the error stack on the client if the server is not in
    production mode.

### Changed

-   magellan-server has tslib as production dependency to ease integration in custom servers.

## [0.1.4] - 2022-11-08

SPA Routing

### Added

-   Wildcard paths not pointing to static files now redirect to the static root path.

## [0.1.3] - 2022-08-04

Additional supported serializations

### Added

-   Implements date transport support for LocalDate and LocalDateTime.

### Fixed

-   Implements logic to handle incomplete replacement transport configurations.

## [0.1.0] - 2022-07-29

Initial Release

### Added

-   (Almost) invisible transport layer between browser and JVM
-   Effortless configuration of service endpoints
-   Automatic serialization of input/output values
-   Transparent error messages and exception handling
