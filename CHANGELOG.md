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

### Changed

- Upgraded TypeScript dependency to `5.0.x`
- Upgraded `@quatico/websmith-*` dependencies to `0.4.0`
- Made the client transformation code more strict. Throws an error during the code generation if the client function accepts a destructured object or a function as parameter.

### Removed

- Removed `packages/java` focusing the project on nodejs.
- Removed unused code and dependencies.

## [0.3.0]

### Added

- Support for `merge: true` in `@quatico/magellan-client/transport/config.js` to merge the configuration with the
  existing configuration of a previous magellan-client frontend instead of replacing it.

### Changed 

- Updates @quatico/magellan-client documentation to current transport configuration.

## [0.2.2] - 2023-02-26

### Changed

- Exposing additional server api aspects to enable custom express server usage with Magellan
- Remove maven-frontend-plugin dependency from Serialization maven package.

## [0.2.1] - 2023-02-07

### Added 

- Serialization and deserialization errors during transport-request handling reject the promise.

### Fixed 

- Removes unnecessary dependency to maven-flatten-plugin in serialization package.

## [0.2.1] - 2023-02-07

### Added

- Support --transpileOnly command line flag for `magellan compile`

### Changed 

- Update to websmith v0.3.5 addressing the undesirable error output.
- Separate lint and lint:fix: pre-commit hooks now fix linting; CI only validates that the linting rules are followed.

## [0.2.0] - 2022-12-14

### Added 

- service functions throwing errors now yield a rejection of the client promise with the error message.
- service functions throwing errors now yield a console.error with the error stack on the client if the server is not in
  production mode.

### Changed

- magellan-server has tslib as production dependency to ease integration in custom servers.

## [0.1.4] - 2022-11-08

SPA Routing

### Added 

- Wildcard paths not pointing to static files now redirect to the static root path.

## [0.1.3] - 2022-08-04

Additional supported serializations

### Added 

- Implements date transport support for LocalDate and LocalDateTime.

### Fixed

- Implements logic to handle incomplete replacement transport configurations.

## [0.1.0] - 2022-07-29

Initial Release

### Added

- (Almost) invisible transport layer between browser and JVM
- Effortless configuration of service endpoints
- Automatic serialization of input/output values
- Transparent error messages and exception handling