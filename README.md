<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->

# Magellan

[![npm version](https://badge.fury.io/js/@quatico%2Fmagellan-cli.svg)](https://www.npmjs.com/search?q=%40quatico)

The Magellan project provides compiler tooling and a runtime API for remote execution of service functions written in TypeScript.

In many applications, backend developers have to create REST APIs, e.g., using [swagger.io](https://swagger.io/). Frontend developer implement client code in their components to present domain logic and data in the browser. During the development developers infrontend and backend have numerous discussions about this API, followed by changes and extensions on both sides. Magellan simplifies this process by providing a compiler that generates all involved code for both sides.

Magellan is a TypeScript library that provides a compiler and runtime API for service functions with the following features:

- Transparent support to write services that consume node modules in the frontend
- npm package generation of TypeScript server code for remote execution through node
- (Almost) invisible transport layer between browser and node.
- Effortless configuration of service endpoints
- Automatic serialization of input/output values
- Transparent error messages and exception handling

## Documentation

The complete documentation including a **Getting Started** can be found here: <https://docs.quatico.dev/magellan/intro>

## Development

### Quick Start

```bash
# Set up development environment (includes watchman configuration)
npm run dev:setup

# Run tests (with automatic watchman management)
npm run test

# Start watch mode (with automatic watchman management)
npm run watch
```

### Watchman Management

This project includes automatic watchman management to prevent common file watching issues. See [Watchman Management Guide](../docs/WATCHMAN_MANAGEMENT.md) for details.

**Quick commands:**

- `npm run watchman:status` - Check watchman status
- `npm run watchman:reset` - Reset watchman if experiencing issues
