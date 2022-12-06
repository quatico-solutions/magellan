<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
<!-- markdownlint-disable MD024 -->

# Releases

Release notes follow the [keep a changelog](https://keepachangelog.com/en/1.0.0/) format.

## [Unreleased]

### Added

- @service functions throwing on the server ensure the client promise is rejected.

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

## vx.y.z

> TBD

### TBD

- Bugfix :pill::
- Improvement :gift_heart::
- Feature :sparkles::
- Documentation :bookmark::
