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

## [0.19.0] - 2025-12-19

### Added

- `@quatico/magellan-cli`: Added comprehensive end-to-end integration tests (`cli-e2e.test.ts`) that verify the complete compilation → server → client → HTTP request flow, including context propagation and parameter handling.
- `@quatico/magellan-server`: Exported `Sdk` and `createFunctionRoute` from the main package for easier testing and custom handler implementations.

### Fixed

- `@quatico/magellan-addons`: **IMPORTANT** - Server-side compiled functions now maintain natural function signatures instead of using object destructuring on the first parameter. This enables direct SDK invocation (e.g., in tests) and custom handler implementations without manual parameter wrapping.
- `@quatico/magellan-server`: Added `extractParameterValue` helper in middleware to automatically unwrap client-wrapped parameters (`{ paramName: value }`) before passing to service functions.
- `@quatico/magellan-server`: Enhanced parameter unwrapping to handle edge cases: empty objects, null values, primitives, arrays, and multi-property objects (backwards compatibility).

### Changed

- **Server Function Signatures**: Compiled server functions no longer use object destructuring.
  - **Before**: `export const getUser = ({ id }: { id: string }, context?) => {...}`
  - **After**: `export const getUser = (id: string, context?) => {...}`
  - **Impact**: Service functions can now be called directly with unwrapped parameters, making BDD tests and custom handlers simpler.
  - **Migration**: No code changes needed - just recompile with `magellan compile --server`.

### Technical Details

**For users with custom handlers**: The standard middleware now unwraps client-wrapped parameters before invoking functions. If you have a custom handler, ensure it follows this pattern:

```typescript
const parsedData = unpackObject(JSON.parse(data));
const input = parsedData && typeof parsedData === "object" && Object.keys(parsedData).length === 1
    ? Object.values(parsedData)[0]
    : parsedData;
await sdk.invokeFunction(name, input, namespace, context);
```

Or better yet, use the standard middleware which handles this automatically.

## [0.17.0] - 2025-10-14

### Added

- `@quatico/magellan-react`: Added two react hooks for service functions, `useQueryService` and `useMutationService`
- `@quatico/magellan-react`: Added comprehensive state flags for better state management (`isPending`, `isLoadingError`, `isRefetchError`, `isIdle`, `status`)

### Changed

- `@quatico/magellan-react`: Aligned `useQueryService` and `useMutationService` return types with TanStack Query's discriminated union pattern for improved type narrowing

## [0.16.0] - 2025-01-07

### Added

- `@quatico/magellan-cli`: Added validation to prevent using `--client` and `--server` options together, providing clear error messaging for incompatible CLI options.

### Fixed

- `@quatico/magellan-cli`: Fixed console errors in test output by creating mock type declarations for `@quatico/magellan-shared` and `@quatico/magellan-client` modules during test execution.
- Fixed Watchman configuration file (`.watchmanconfig`) to use proper field names and structure, eliminating repeated directory recrawl warnings during development.
- `@quatico/magellan-cli`: Improved error reporting in CLI commands by using `process.stderr.write` instead of `console.error` for consistent error handling.

### Changed

- Enhanced test environment setup to provide mock modules for better test isolation and cleaner console output.
- Updated Watchman ignore patterns to properly separate VCS directories, build directories, and file patterns for improved file watching performance.

## [0.15.0] - 2025-07-25

## [0.14.2] - 2025-04-08

## Changed

- Replaced `yarn` with `pnpm`
- Replaced `@swc/jest` with `ts-jest`
- Upgrade to `eslint` v9

## [0.14.1] - 2025-04-02

### Added

- `@quatico/magellan-shared`: Now supports context management across service calls by providing event-based context updates using `ClientContextChangedEvent`.
- `@quatico/magellan-client`: New `ClientContextHandler` for managing client-side context. It enables storing and retrieving per-namespace context information (e.g., a request identifier or custom header which should be provided to each `remoteInvoke` call). Also, if registered the `ClientContextHandler` listens for context updates propagated using the `ClientContextChangedEvent`.

## [0.14.0] - 2025-03-29

### Added

- `@quatico/magellan-shared`: New `Context` system with generic interfaces for client and server contexts
- `@quatico/magellan-addons`: Validation for service function imports to ensure both `Context` and `Serialization` are properly imported

### Changed

- **BREAKING**: `@quatico/magellan-shared`: Removed `ExecutionContext` type
- **BREAKING**: `@quatico/magellan-client` and `@quatico/magellan-server`: Removed the `Context` interface
- **BREAKING**: `@quatico/magellan-addons`: Removed `TransformationArguments` interface
- `@quatico/magellan-addons`: Updated transformer implementations to validate required imports
- `@quatico/magellan-addons`: Reformed client transformer to produce context-aware service function calls
- `@quatico/magellan-addons`: Reformed server transformer to handle context parameters

### Fixed

- `@quatico/magellan-addons`: Enforced proper imports for service functions to prevent runtime errors
- `@quatico/magellan-addons`: Fixed error handling in transformer functions
- `@quatico/magellan-client` and `@quatico/magellan-server`: Fixed headers assignment in network requests to correctly use client headers

This update represents a significant overhaul of the context management system, enabling better type safety and separation of client and server concerns.
**BREAKING**: Service functions now require explicit imports for `Context` and `Serialization` types, and transformers validate these requirements.

## [0.13.0] - 2025-02-20

### Changed

- **Breaking Change**: All dependencies apart from `@quatico/magellan-cli` have all their dependencies move from bundled to peer dependencies.
- **Breaking Change**: `@quatico/magellan-addons`: `client-function-transform` - now removes all code from generated/transformed client-side service function files that are not the service functions themselves. This includes all imports, exported and non-exported code.
- `@quatico/magellan-addons`: `client-function-transform` - changed behaviour. `functionsDir` is no longer required. All source files are checked for `@service()` decorators.
- `@quatico/magellan-addons`: `serivce-function-generate` - changed behaviour. `functionsDir` is no longer required. All source files are checked for `@service()` decorators.

## [0.12.0] - 2025-02-14

### Fixed

- **Breaking Change**: Removed short options from CLI commands. Fixes bug when using `-p` for both `--project` and `--port`. Use long options `--project <path>` and `--port <port>` instead.

### Changed

- **Breaking Change**: Only Node.js 18 or higher is supported.
- Upgraded `@quatico/websmith-*` dependencies to `0.6.3`
- Upgraded `commander` to `12.1.0`
- Upgraded `minimist` to `1.2.8`

### Removed

- Removed `node-fetch` as a dependency as Node.js 18 and above have it built-in.
- Removed `form-data` as a dependency as Node.js 18 and above have it built-in.
- Removed `morgan` as it was not used.

## [0.11.2] - 2024-11-15

### Added

- Created a new package `@quatico/magellan-starter` containing templates for different frontend frameworks. The package contains a binary `create-magellan` that guides the user through the process of scaffolding the template in a directory of choice. Currently, the following templates are available:
  - `react-typescript-webpack`: a simple React application using Typescript and Webpack

## [0.11.0] - 2024-11-15

### Fixed

- `formdata-fetch`: improved endpoint validation for absolute and relative urls. Invalid URLs now throw an exception.

### Changed

- **Breaking Change**: The functions `addTransport` and `addTransportIfAbsent` have been removed from the public API. Please use `setTransport` instead. `setTransport` will replace the transport handler if it already exists, or add it if it does not.
- **Breaking Change**: The functions `addNamespace` and `addNamespaceIfAbsent` have been removed from the public API. Please use `setNamespace` instead. `setNamespace` will replace the namespace mapping if it already exists, or add it if it does not.
- **Breaking Change**: The function `applyExecutionContext` has been removed from the public API.

## [0.10.0] - 2024-09-20

### Fixed

- Fixes `resolveNamespace` with custom namespace input returning default namespace and transport if custom namespace could not be resolved. The function now throws an error that the configuration for the custom namespace could not be found.

## [0.8.0] - 2024-06-18

### Added

- Support for BigInt serialization and deserialization.

## [0.6.2] - 2024-03-25

### Fixed

- Rejects promise if transport failed (response not ok) in formdata-fetch (server and client). Previously, we attempted to retrieve the response as text even if the response was not ok.

## [0.6.1]

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
