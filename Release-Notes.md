<!--
 ---------------------------------------------------------------------------------------------
   Copyright (c) Quatico Solutions AG. All rights reserved.
   Licensed under the MIT License. See LICENSE in the project root for license information.
 ---------------------------------------------------------------------------------------------
-->

# Releases

## v0.2.0

> TBD

### TBD

- Bugfix :pill::
- Improvement :gift_heart::
- Feature :sparkles::
- Documentation :bookmark::

## v0.1.0

> TBD

### Initial Release

- Feature :sparkles:: Exposure of a transport configuration (@quatico/magellan-client/lib/configuration/config.js) that can be replaced during bundling.
- Feature :sparkles:: The ability to define the namespace to which a service function belongs.
- Improvement :gift_heart:: Function requests data using FormData instead of raw JSON.
- Feature :sparkles:: Client proxy transpilation of functions with @rpc comment
- Feature :sparkles:: Server function bundling of functions with @rpc comment
- Feature :sparkles:: tsc compiler integration with watch mode
- Feature :sparkles:: Webpack loader for server package bundling
- - Feature :sparkles:: CLI package for running the compiler and server from within a single place, use with @quatico/magellan-cli
- Feature :sparkles:: Input parameter and result de-/serialization between browser and node
- Improvement :gift_heart:: Virtual filesystem for seamless testing of compilation and bundling
- Improvement :gift_heart:: New E2E testbed for key usage scenarios with compiler and webpack
- 
- Bugfix :pill:: Fixes an issue with missing published @quatico/magellan-shared package
- Bugfix :pill:: Fixes an issue with updating client files during transformation
- Bugfix :pill:: Fixes an issue with peer dependencies
- Feature :sparkles:: Watch mode support for webpack plugin
- Feature :sparkles:: Resolution of external dependencies in generated service modules on server
- Bugfix :pill:: Fixes an issue with path resolution on Window
- Improvement :gift_heart:: Renames @rpc decorator to @service
- Feature :sparkles:: Client and Server code transformation extracted as @quatico/websmith-api Addons.
- Improvement :gift_heart:: Compiler package removed and replaced with @quatico/websmith-compiler.
- Improvement :gift_heart:: Webpack package removed.
- Bugfix :pill:: Adds missing production package dependency.
