<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
# @quatico/magellan-server

This is a standalone server for a the magellan compiler. You can use it to serve your compiled project using the magellan compiler. It exposes a single NodeJS server that serve your frontend code together with implemented remote functions.

See the `@quatico/magellan-cli` project for more details on how to run the server executable.

## Installation

Add a development dependency to your project, e.g., using `yarn`:

```sh
yarn add -D @quatico/magellan-server
```

## Usage

TBD

## Debug Service Functions

You can debug the node instance running your Magellan server with the following line:

```sh
node --inspect ./node_modules/@quatico/magellan-cli/lib/index.js serve ./lib/client --serverModuleDir ./lib/server-esm
```

Adjust the `--serverModuleDir` parameter and point it to your compiler output directory.
