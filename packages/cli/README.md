<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->
# @quatico/magellan-cli

This is the command-line interface (CLI) for the magellan project. You can run various commands to control the compiler and the server with it.

## Getting started

### Install CLI

Add a development dependency to your project, e.g., using `yarn`:

```sh
yarn add -D @quatico/magellan-cli
```

Add a build or watch target to your `package.json`:

```json
// package.json
...
"scripts": {
    "build": "magellan compile ./src/functions",
    "watch": "magellan compile --watch ./src/functions",
    "serve": "magellan serve ./lib",
    ...
},

```

The compiler searches for annotated ES6 functions in the target folder, e.g,. `./src/functions` and replaces them with server proxy-functions. All remaining code will be compiled with the default
`tsc` using your `tsconfig.json`.

Do the following to move the invocation of your code to the server:

1. Extract some code from your client into a separate function
1. Move the function into an ES6 module, export the function and call it from the client
1. Add a comment with an @service annotation to the function, e.g., `// @service()`
1. Move the new ES6 module file into the dedicated folder, e.g., `./src/functions`
1. Call the compiler, e.g., `magellan compile ./src/functions`. This will output
    1. The client results should go into the TS outDir, e.g.

    ```json
    {
        {
        "compilerOptions": {
            "outDir": "./lib",
            ...
        },
    }
    ```

    1. the server functions into `./server-esm`
1. Bundle the output with your html and stylesheets, for example into `./public`
1. Serve your static page and functions with `magellan serve ./public`
1. Access the running page under <http://localhost:3000>.

## Working with Webpack

Magellan provides a webpack loader - plugin combination that acts as a first step providing output for ts-loader and babel in case you work with a ES2015 target you wish to emit bundle to ES5.

The integration in your webpack configuration is straight forward:

### Installation

```sh
yarn add -D @quatico/websmith-webpack
```

### Update webpack.config.js

```js
const { MagellanPlugin } = require("@quatico/websmith-webpack");

module.exports = () => {
    return {
        // ...
        module: {
            rules: [
                //...
                // Add loader or replace ts-loader config if used
                {
                    test: /\.[jt]sx?$/,
                    include: [path.resolve(__dirname, "src")],
                    loader: MagellanPlugin.loader,
                },
                // ...
            ],
        },

        // ...

        plugins: [
            new MagellanPlugin({
                project: path.resolve(__dirname, "tsconfig.json"),
                serverModuleDir: path.resolve(__dirname, "server-esm"),
                functionsDir: path.resolve(__dirname, "src/functions"),
            }),
            // ...
        ],
    };
};
```

## Configuration

The compiler provides various parameters for configuration. Display the help screen for
more details:

```js
magellan --help
magellan compile --help
magellan serve --help
```

For example, a custom configuration could look as follows:

```sh
magellan compile --project ./tsconfig.json --hostname http://dockerhost --port 8080 --debug
--watch ./src/functions

magellan serve ./lib --serverModuleDir ./server-esm
```
