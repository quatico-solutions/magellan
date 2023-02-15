<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
<!-- markdownlint-disable MD024 -->

# Releases

Release notes follow the [keep a changelog](https://keepachangelog.com/en/1.0.0/) format.

## [Unrelease]

### Improvements

- Exposing additional server api aspects to enable custom express server usage with Magellan

## [0.2.1] - 2023-02-07

### New Features

- Support --transpileOnly command line flag for `magellan compile`

### Chore

- Update to websmith v0.3.5 addressing the undesirable error output.
- Separate lint and lint:fix: pre-commit hooks now fix linting; CI only validates that the linting rules are followed.

## [0.2.0] - 2022-12-14

### New Features

- service functions throwing errors now yield a rejection of the client promise with the error message.
- service functions throwing errors now yield a console.error with the error stack on the client if the server is not in production mode.

### Changed

- magellan-server has tslib as production dependency to ease integration in custom servers.

## [0.1.4] - 2022-11-08

SPA Routing

### New Features

- Wildcard paths not pointing to static files now redirect to the static root path.

## [0.1.3] - 2022-08-04

Additional supported serializations

### New Features

- Implements date transport support for LocalDate and LocalDateTime.

### Fixed

- Implements logic to handle incomplete replacement transport configurations.

## [0.1.0] - 2022-07-29

Initial Release

### New Features

- (Almost) invisible transport layer between browser and JVM
- Effortless configuration of service endpoints
- Automatic serialization of input/output values
- Transparent error messages and exception handling

## vx.y.z

> TBD

### TBD

- Bugfix :pill::
- Improvement :gift_heart::
- Feature :sparkles::
- Documentation :bookmark::
